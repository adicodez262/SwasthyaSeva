import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { mockApi } from '../services/mockApi';
import { RiskAlert, RiskBadge } from '../components/RiskComponents';
import { ArrowLeft } from 'lucide-react';

const PatientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const data = await mockApi.getPatient(id);
        setPatient(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchPatient();
  }, [id]);

  if (loading) return <div style={{ padding: 'var(--spacing-8)', textAlign: 'center' }}>Loading...</div>;
  if (!patient) return <div style={{ padding: 'var(--spacing-8)', textAlign: 'center' }}>Patient not found</div>;

  const Row = ({ label, value }) => (
    <div>
      <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '0.125rem' }}>{label}</div>
      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{value ?? '--'}</div>
    </div>
  );

  const smokingLabel = ['No', 'Yes', 'Former'][patient.smoking_status] ?? patient.smoking_status;
  const activityLabel = ['Low', 'Moderate', 'High'][patient.physical_activity] ?? patient.physical_activity;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
      <div>
        <button onClick={() => navigate('/dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-4)' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{patient.name}</h1>
            <p style={{ color: 'var(--color-text-muted)' }}>ID: {patient.patient_id} • {patient.age} yrs • {patient.gender} {patient.is_pregnant ? '• 🤰 Pregnant' : ''}</p>
          </div>
          <RiskBadge riskLevel={patient.risk_level} />
        </div>
      </div>

      <RiskAlert riskLevel={patient.risk_level} />

      {patient.status === 'queued' && (
        <div style={{ backgroundColor: 'var(--color-warning-bg)', padding: 'var(--spacing-3)', borderRadius: 'var(--radius-md)', color: '#b45309', fontWeight: 500, display: 'inline-block', alignSelf: 'flex-start' }}>
          ⏳ {t('details.queued')}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: 'var(--spacing-4)', fontWeight: 700, borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>Vitals</h3>
          <div className="grid grid-cols-2 gap-4">
            <Row label="Blood Pressure" value={`${patient.Systolic_BP || patient.bp_systolic || '--'} / ${patient.Diastolic_BP || patient.bp_diastolic || '--'} mmHg`} />
            <Row label="Blood Sugar (Fasting)" value={`${patient.Blood_Sugar_Fasting || patient.sugar_level || '--'} mg/dL`} />
            <Row label="Pulse Rate" value={`${patient.pulse_rate || '--'} BPM`} />
            <Row label="BMI" value={patient.bmi} />
            <Row label="Body Temperature" value={patient.Body_Temp_F ? `${patient.Body_Temp_F} °F` : '--'} />
            <Row label="SPO2" value={patient.SPO2 ? `${patient.SPO2} %` : '--'} />
            <Row label="Hemoglobin" value={patient.Hemoglobin_Level ? `${patient.Hemoglobin_Level} g/dL` : '--'} />
            <Row label="Weight / Height" value={`${patient.weight_kg || '--'} kg / ${patient.height_cm || '--'} cm`} />
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: 'var(--spacing-4)', fontWeight: 700, borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>Lifestyle</h3>
          <div className="grid grid-cols-2 gap-4">
            <Row label="Smoking" value={smokingLabel} />
            <Row label="Alcohol" value={patient.alcohol_use ? 'Yes' : 'No'} />
            <Row label="Physical Activity" value={activityLabel} />
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: 'var(--spacing-4)', fontWeight: 700, borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>Medical Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <Row label="Known Diabetic" value={patient.known_diabetic ? 'Yes' : 'No'} />
            <Row label="Known Hypertensive" value={patient.known_hypertensive ? 'Yes' : 'No'} />
            <Row label="On Medication" value={patient.on_medication ? 'Yes' : 'No'} />
            <Row label="Acute Fever" value={patient.acute_fever_symptoms ? 'Yes' : 'No'} />
            <Row label="Pregnancy" value={patient.is_pregnant ? 'Yes' : 'No'} />
            <Row label="Triage Action" value={patient.Triage_Action ?? '--'} />
            <div style={{ gridColumn: 'span 2' }}>
              <Row label="Symptoms" value={patient.symptoms || 'None reported'} />
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: 'var(--spacing-4)', fontWeight: 700, borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>Family History</h3>
          <div className="grid grid-cols-2 gap-4">
            <Row label="Diabetes" value={patient.family_history_diabetes ? 'Yes' : 'No'} />
            <Row label="Hypertension" value={patient.family_history_hypertension ? 'Yes' : 'No'} />
            <Row label="Heart Disease" value={patient.family_history_heart_disease ? 'Yes' : 'No'} />
          </div>
        </div>

        {(patient.Delta_SystolicBP || patient.Delta_Hemoglobin || patient.Delta_BloodSugar) && (
          <div className="card">
            <h3 style={{ fontSize: '1rem', marginBottom: 'var(--spacing-4)', fontWeight: 700, borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>Changes from Last Visit</h3>
            <div className="grid grid-cols-2 gap-4">
              <Row label="ΔSystolic BP" value={patient.Delta_SystolicBP || '--'} />
              <Row label="ΔHemoglobin" value={patient.Delta_Hemoglobin || '--'} />
              <Row label="ΔBlood Sugar" value={patient.Delta_BloodSugar || '--'} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDetails;
