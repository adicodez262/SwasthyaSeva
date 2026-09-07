// API Service connecting to FastAPI backend with offline local storage fallback
const API_BASE_URL = (import.meta.env && import.meta.env.VITE_API_BASE_URL) || 'http://127.0.0.1:8000';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getStoredPatients = () => {
  const data = localStorage.getItem('asha_patients');
  return data ? JSON.parse(data) : [];
};

const getStoredQueue = () => {
  const data = localStorage.getItem('asha_teleconsult_queue');
  return data ? JSON.parse(data) : [];
};

const buildFastApiPayload = (patientData, patientId) => {
  const ashaSession = JSON.parse(localStorage.getItem('asha_session') || '{}');
  const asha_id = ashaSession.asha_id || null;

  const ageVal = parseInt(patientData.Age ?? patientData.age) || 30;
  const isPregnantVal = parseInt(patientData.is_pregnant) || 0;
  const heightVal = parseFloat(patientData.height_cm) || 160.0;
  const weightVal = parseFloat(patientData.weight_kg) || 60.0;

  let bmiVal = parseFloat(patientData.bmi);
  if (!bmiVal && heightVal > 0 && weightVal > 0) {
    bmiVal = parseFloat((weightVal / Math.pow(heightVal / 100.0, 2)).toFixed(2));
  }
  if (!bmiVal) bmiVal = 0.0;

  return {
    patient_id: patientId,
    name: patientData.name || 'Anonymous',
    gender: patientData.gender || 'male',
    device_id: 'web-portal-01',
    asha_id: asha_id,
    timestamp: new Date().toISOString(),
    Age: ageVal,
    is_pregnant: isPregnantVal,
    height_cm: heightVal,
    weight_kg: weightVal,
    bmi: bmiVal,
    smoking_status: parseInt(patientData.smoking_status) || 0,
    alcohol_use: parseInt(patientData.alcohol_use) || 0,
    physical_activity: parseInt(patientData.physical_activity) || 1,
    known_diabetic: parseInt(patientData.known_diabetic) || 0,
    known_hypertensive: parseInt(patientData.known_hypertensive) || 0,
    on_medication: parseInt(patientData.on_medication) || 0,
    family_history_diabetes: parseInt(patientData.family_history_diabetes) || 0,
    family_history_hypertension: parseInt(patientData.family_history_hypertension) || 0,
    family_history_heart_disease: parseInt(patientData.family_history_heart_disease) || 0,
    acute_fever_symptoms: parseInt(patientData.acute_fever_symptoms) || 0,
    Body_Temp_F: parseFloat(patientData.Body_Temp_F) || 98.6,
    pulse_rate: parseInt(patientData.pulse_rate) || 72,
    Systolic_BP: parseFloat(patientData.Systolic_BP) || 120.0,
    Diastolic_BP: parseFloat(patientData.Diastolic_BP) || 80.0,
    Blood_Sugar_Fasting: parseFloat(patientData.Blood_Sugar_Fasting) || 90.0,
    SPO2: parseFloat(patientData.SPO2) || 98.0,
    Hemoglobin_Level: parseFloat(patientData.Hemoglobin_Level) || 13.0,
    Delta_SystolicBP: parseFloat(patientData.Delta_SystolicBP) || 0.0,
    Delta_Hemoglobin: parseFloat(patientData.Delta_Hemoglobin) || 0.0,
    Delta_BloodSugar: parseFloat(patientData.Delta_BloodSugar) || 0.0,
  };
};

export const mockApi = {
  getPatients: async () => {
    return getStoredPatients();
  },

  getPatient: async (id) => {
    const patients = getStoredPatients();
    return patients.find(p => p.patient_id === id) || null;
  },

  assessRisk: async (patientData) => {
    try {
      const payload = buildFastApiPayload(patientData, 'TMP_PREDICT');
      const response = await fetch(`${API_BASE_URL}/api/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        const data = await response.json();
        return {
          risk_level: data.risk_level,
          confidence: data.confidence,
        };
      }
    } catch (err) {
      console.warn('Real prediction endpoint offline/failed, using local fallback:', err);
    }

    // Local fallback heuristic if offline
    let risk_level = 'low';
    const sbp = parseFloat(patientData.Systolic_BP) || 0;
    const sugar = parseFloat(patientData.Blood_Sugar_Fasting) || 0;
    const spo2 = parseFloat(patientData.SPO2) || 100;
    const temp = parseFloat(patientData.Body_Temp_F) || 98.6;

    if (sbp >= 160 || sugar >= 250 || spo2 < 90 || temp >= 104) {
      risk_level = 'critical';
    } else if (sbp >= 140 || sugar >= 200 || spo2 < 95 || temp >= 100.4 || patientData.smoking_status === 1) {
      risk_level = 'moderate';
    }

    return { risk_level, confidence: null };
  },

  createPatient: async (patientData, isOffline = false) => {
    const patients = getStoredPatients();
    const generatedId = patientData.patient_id || `P${String(patients.length + 1).padStart(3, '0')}`;

    if (!isOffline) {
      const payload = buildFastApiPayload(patientData, generatedId);
      const response = await fetch(`${API_BASE_URL}/api/patient`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorMsg = await response.text();
        throw new Error(`FastAPI error (${response.status}): ${errorMsg}`);
      }

      const result = await response.json();
      const newPatient = {
        ...patientData,
        patient_id: result.patient_id || generatedId,
        risk_level: result.risk_level,
        confidence: result.confidence,
        createdAt: new Date().toISOString(),
        status: (result.risk_level === 'YELLOW' || result.risk_level === 'moderate') ? 'queued' : 'saved',
        savedLocally: false,
      };

      localStorage.setItem('asha_patients', JSON.stringify([newPatient, ...patients]));
      return newPatient;
    }

    // Offline mode: save locally
    const fallbackAssessment = await mockApi.assessRisk(patientData);
    const newPatient = {
      ...patientData,
      patient_id: generatedId,
      risk_level: patientData.risk_level || fallbackAssessment.risk_level,
      confidence: fallbackAssessment.confidence || null,
      createdAt: new Date().toISOString(),
      status: (patientData.risk_level === 'moderate' || patientData.risk_level === 'YELLOW') ? 'queued' : 'saved',
      savedLocally: true,
    };

    localStorage.setItem('asha_patients', JSON.stringify([newPatient, ...patients]));
    return newPatient;
  },

  queueTeleconsultation: async (patientId) => {
    const queue = getStoredQueue();
    if (!queue.includes(patientId)) {
      queue.push(patientId);
      localStorage.setItem('asha_teleconsult_queue', JSON.stringify(queue));
    }
    return { success: true, queued: true };
  }
};

