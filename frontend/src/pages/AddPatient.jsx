import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { mockApi } from '../services/mockApi';
import { useNetwork } from '../context/NetworkContext';
import { RiskAlert, RiskBadge } from '../components/RiskComponents';

// ─── Helper components defined OUTSIDE the main component ───────────────────
// This prevents React from unmounting/remounting them on every keystroke.

const SectionTitle = ({ title }) => (
  <h2 style={{
    fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-dark)',
    marginBottom: '1rem', paddingBottom: '0.5rem',
    borderBottom: '2px solid var(--color-border)'
  }}>{title}</h2>
);

const FieldGroup = ({ label, helper, children }) => (
  <div className="form-group">
    <label className="form-label">
      {label}{' '}
      {helper && <span style={{ fontWeight: 500, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>({helper})</span>}
    </label>
    {children}
  </div>
);

const ToggleBtn = ({ field, onLabel, offLabel, value, onChange, onVal = 1, offVal = 0 }) => (
  <div style={{
    display: 'flex', border: '2px solid var(--color-border)',
    borderRadius: 'var(--radius-md)', overflow: 'hidden'
  }}>
    <button type="button" onClick={() => onChange(field, onVal)} style={{
      flex: 1, padding: '0.75rem 1rem', fontSize: '1rem', fontWeight: 700,
      backgroundColor: value === onVal ? 'var(--color-primary)' : 'var(--color-surface)',
      color: value === onVal ? 'white' : 'var(--color-text)',
    }}>{onLabel}</button>
    <button type="button" onClick={() => onChange(field, offVal)} style={{
      flex: 1, padding: '0.75rem 1rem', fontSize: '1rem', fontWeight: 700,
      backgroundColor: value === offVal ? '#e2e8f0' : 'var(--color-surface)',
      color: value === offVal ? 'var(--color-text-dark)' : 'var(--color-text)',
    }}>{offLabel}</button>
  </div>
);

const ThreeBtn = ({ field, labels, value, onChange }) => (
  <div style={{ display: 'flex', gap: '0.5rem' }}>
    {labels.map((lbl, idx) => (
      <button key={idx} type="button" onClick={() => onChange(field, idx)} style={{
        flex: 1, padding: '0.75rem 0.5rem', fontSize: '0.95rem', fontWeight: 700,
        border: '2px solid var(--color-border)', borderRadius: 'var(--radius-md)',
        backgroundColor: value === idx ? 'var(--color-primary-light)' : 'var(--color-surface)',
        color: value === idx ? 'var(--color-primary)' : 'var(--color-text)',
      }}>{lbl}</button>
    ))}
  </div>
);

const GenderBtn = ({ value, onChange }) => {
  const options = [['male', '♂ Male'], ['female', '♀ Female'], ['other', 'Other']];
  return (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      {options.map(([val, lbl]) => (
        <button key={val} type="button" onClick={() => onChange('gender', val)} style={{
          flex: 1, padding: '0.75rem 0.25rem', fontSize: '0.9rem', fontWeight: 700,
          border: '2px solid var(--color-border)', borderRadius: 'var(--radius-md)',
          backgroundColor: value === val ? 'var(--color-primary-light)' : 'var(--color-surface)',
          color: value === val ? 'var(--color-primary)' : 'var(--color-text)',
        }}>{lbl}</button>
      ))}
    </div>
  );
};
// ────────────────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 5;

const AddPatient = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isOnline } = useNetwork();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const [formData, setFormData] = useState({
    // Step 1 - Basic Details
    name: '',
    age: '',
    gender: 'male',
    is_pregnant: 0,
    weight_kg: '',
    height_cm: '',

    // Step 2 - Vitals
    Systolic_BP: '',
    Diastolic_BP: '',
    Blood_Sugar_Fasting: '',
    pulse_rate: '',
    bmi: '',
    Body_Temp_F: '',
    SPO2: '',
    Hemoglobin_Level: '',

    // Step 3 - Lifestyle & History
    smoking_status: 0,
    alcohol_use: 0,
    physical_activity: 1,
    family_history_diabetes: 0,
    family_history_hypertension: 0,
    family_history_heart_disease: 0,
    known_diabetic: 0,
    known_hypertensive: 0,
    on_medication: 0,
    acute_fever_symptoms: 0,

    // Step 4 - Medical
    symptoms: '',

    // Unused but required by ML API contract
    Delta_SystolicBP: 0,
    Delta_Hemoglobin: 0,
    Delta_BloodSugar: 0,
    Triage_Action: 0,
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Auto-reset pregnancy if gender is changed from female
      if (field === 'gender' && value !== 'female') {
        newData.is_pregnant = 0;
      }
      
      // Auto-calculate BMI
      if (field === 'weight_kg' || field === 'height_cm') {
        const w = parseFloat(field === 'weight_kg' ? value : prev.weight_kg);
        const h = parseFloat(field === 'height_cm' ? value : prev.height_cm) / 100;
        if (w > 0 && h > 0) newData.bmi = (w / (h * h)).toFixed(1);
      }
      return newData;
    });
  };

  const renderStepIndicator = () => (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem', overflowX: 'auto' }}>
      {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s, i) => (
        <React.Fragment key={s}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: step >= s ? 'var(--color-primary)' : 'var(--color-surface)',
            color: step >= s ? 'white' : 'var(--color-text-muted)',
            border: `3px solid ${step >= s ? 'var(--color-primary)' : 'var(--color-border)'}`,
            fontWeight: 800, fontSize: '1.1rem'
          }}>{s}</div>
          {i < TOTAL_STEPS - 1 && (
            <div style={{
              flex: 1, height: '4px', minWidth: '16px', margin: '0 8px', borderRadius: '2px',
              backgroundColor: step > s ? 'var(--color-primary)' : 'var(--color-border)'
            }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const validateStep1 = () => {
    if (!formData.name.trim()) { alert(t('add_patient.required_name')); return false; }
    if (!formData.age) { alert(t('add_patient.required_age')); return false; }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    setStep(s => s + 1);
  };

  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const savedPatient = await mockApi.createPatient(formData, !isOnline);
      if ((savedPatient.risk_level === 'moderate' || savedPatient.risk_level === 'YELLOW') && !isOnline) {
        await mockApi.queueTeleconsultation(savedPatient.patient_id);
      }
      setResult({ ...savedPatient });
    } catch (error) {
      console.error('Submission failed:', error);
      alert(error.message || t('alerts.offline_error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (result) {
    return (
      <div style={{ maxWidth: '650px', margin: '0 auto' }}>
        <RiskAlert riskLevel={result.risk_level} />
        <div className="card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.5rem' }}>{t('details.title')}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', width: '100%', textAlign: 'left', marginTop: '1rem' }}>
            <div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>{t('fields.name')}</div>
              <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>{result.name}</div>
            </div>
            <div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>ID</div>
              <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>{result.patient_id}</div>
            </div>
            <div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>{t('patient_table.risk')}</div>
              <div style={{ marginTop: '0.25rem' }}>
                <RiskBadge riskLevel={result.risk_level} />
              </div>
            </div>
            {result.confidence !== undefined && result.confidence !== null && (
              <div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>Confidence</div>
                <div style={{ fontWeight: 800, fontSize: '1.2rem', marginTop: '0.25rem' }}>
                  {typeof result.confidence === 'number' ? `${(result.confidence * 100).toFixed(1)}%` : result.confidence}
                </div>
              </div>
            )}
            {!isOnline && (
              <div style={{ gridColumn: 'span 2', color: 'var(--color-text-muted)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ display: 'inline-block', width: '10px', height: '10px', backgroundColor: 'var(--color-offline)', borderRadius: '50%' }}></span>
                {t('add_patient.saved_locally')}
              </div>
            )}
          </div>
          <div className="flex gap-4" style={{ marginTop: '1.5rem' }}>
            <button className="btn btn-outline" onClick={() => navigate(`/patients/${result.patient_id}`)}>{t('patient_table.view')}</button>
            <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>{t('details.back_dashboard')}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '650px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>{t('add_patient.title')}</h1>
      {renderStepIndicator()}

      <div className="card" style={{ marginBottom: '1.5rem' }}>

        {/* ── STEP 1: Basic Details ── */}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <SectionTitle title={t('add_patient.step1')} />

            <FieldGroup label={t('fields.name')}>
              <input
                type="text" className="form-control"
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
              />
            </FieldGroup>

            <div className="grid grid-cols-2 gap-4">
              <FieldGroup label={t('fields.age')}>
                <input
                  type="number" className="form-control" min="0" max="120"
                  value={formData.age}
                  onChange={e => handleInputChange('age', e.target.value)}
                />
              </FieldGroup>
              <FieldGroup label={t('fields.gender')}>
                <GenderBtn value={formData.gender} onChange={handleInputChange} />
              </FieldGroup>
            </div>

            {formData.gender === 'female' && (
              <FieldGroup label={t('fields.pregnancy')}>
                <ToggleBtn
                  field="is_pregnant"
                  value={formData.is_pregnant}
                  onChange={handleInputChange}
                  onLabel={t('fields.yes')}
                  offLabel={t('fields.no')}
                />
              </FieldGroup>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <FieldGroup label={t('fields.weight')} helper="kg">
                <input type="number" step="0.1" className="form-control"
                  value={formData.weight_kg} onChange={e => handleInputChange('weight_kg', e.target.value)} />
              </FieldGroup>
              <FieldGroup label={t('fields.height')} helper="cm">
                <input type="number" step="0.1" className="form-control"
                  value={formData.height_cm} onChange={e => handleInputChange('height_cm', e.target.value)} />
              </FieldGroup>
            </div>
          </div>
        )}

        {/* ── STEP 2: Vitals ── */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <SectionTitle title={t('add_patient.step2')} />

            <FieldGroup label="Blood Pressure" helper="mmHg">
              <div className="flex items-center gap-2">
                <input type="number" className="form-control" placeholder="Systolic (e.g. 120)"
                  value={formData.Systolic_BP} onChange={e => handleInputChange('Systolic_BP', e.target.value)} />
                <span style={{ fontWeight: 800, color: 'var(--color-text-muted)' }}>/</span>
                <input type="number" className="form-control" placeholder="Diastolic (e.g. 80)"
                  value={formData.Diastolic_BP} onChange={e => handleInputChange('Diastolic_BP', e.target.value)} />
              </div>
            </FieldGroup>

            <div className="grid grid-cols-2 gap-4">
              <FieldGroup label="Blood Sugar (Fasting)" helper="mg/dL">
                <input type="number" step="0.1" className="form-control"
                  value={formData.Blood_Sugar_Fasting} onChange={e => handleInputChange('Blood_Sugar_Fasting', e.target.value)} />
              </FieldGroup>
              <FieldGroup label={t('fields.pulse')} helper="BPM">
                <input type="number" className="form-control"
                  value={formData.pulse_rate} onChange={e => handleInputChange('pulse_rate', e.target.value)} />
              </FieldGroup>
              <FieldGroup label="Body Temperature" helper="°F">
                <input type="number" step="0.1" className="form-control" placeholder="98.6"
                  value={formData.Body_Temp_F} onChange={e => handleInputChange('Body_Temp_F', e.target.value)} />
              </FieldGroup>
              <FieldGroup label="SPO2" helper="%">
                <input type="number" step="0.1" min="0" max="100" className="form-control" placeholder="98"
                  value={formData.SPO2} onChange={e => handleInputChange('SPO2', e.target.value)} />
              </FieldGroup>
              <FieldGroup label="Hemoglobin Level" helper="g/dL">
                <input type="number" step="0.1" className="form-control" placeholder="13.5"
                  value={formData.Hemoglobin_Level} onChange={e => handleInputChange('Hemoglobin_Level', e.target.value)} />
              </FieldGroup>
            </div>

            {/* BMI Display */}
            <div style={{ backgroundColor: 'var(--color-primary-light)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-primary-dark)' }}>{t('fields.bmi')}</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>{formData.bmi || '--'}</span>
            </div>
          </div>
        )}

        {/* ── STEP 3: Lifestyle & Family History ── */}
        {step === 3 && (
          <div className="flex flex-col gap-6">
            <SectionTitle title="Lifestyle & History" />

            <FieldGroup label={t('fields.smoking')}>
              <ThreeBtn field="smoking_status" value={formData.smoking_status} onChange={handleInputChange}
                labels={[t('fields.no'), t('fields.yes'), t('fields.former')]} />
            </FieldGroup>

            <FieldGroup label={t('fields.alcohol')}>
              <ToggleBtn field="alcohol_use" value={formData.alcohol_use} onChange={handleInputChange}
                onLabel={t('fields.yes')} offLabel={t('fields.no')} />
            </FieldGroup>

            <FieldGroup label={t('fields.activity')}>
              <ThreeBtn field="physical_activity" value={formData.physical_activity} onChange={handleInputChange}
                labels={[t('fields.low'), t('fields.moderate'), t('fields.high')]} />
            </FieldGroup>
            
            <div style={{ borderTop: '2px solid var(--color-border)', paddingTop: '1.5rem' }}>
              <p style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '1rem', color: 'var(--color-text-dark)' }}>Medical History</p>
              <div className="flex flex-col gap-4">
                {[
                  ['known_diabetic', 'Known Diabetic'],
                  ['known_hypertensive', 'Known Hypertensive'],
                  ['on_medication', t('fields.medication')],
                  ['acute_fever_symptoms', 'Acute Fever / Fever Symptoms'],
                  ['family_history_diabetes', t('fields.family_diabetes')],
                  ['family_history_hypertension', t('fields.family_hypertension')],
                  ['family_history_heart_disease', t('fields.family_heart')],
                ].map(([field, label]) => (
                  <div key={field} className="flex justify-between items-center" style={{ gap: '1.5rem' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 600, flex: 1 }}>{label}</span>
                    <ToggleBtn field={field} value={formData[field]} onChange={handleInputChange}
                      onLabel={t('fields.yes')} offLabel={t('fields.no')} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 4: Medical Information ── */}
        {step === 4 && (
          <div className="flex flex-col gap-5">
            <SectionTitle title="Medical Information" />

            <FieldGroup label={t('fields.symptoms')}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                {['Headache', 'Chest pain', 'Dizziness', 'Breathlessness', 'Fatigue', 'Nausea'].map(s => (
                  <button key={s} type="button"
                    onClick={() => handleInputChange('symptoms', formData.symptoms ? `${formData.symptoms}, ${s}` : s)}
                    style={{ padding: '0.4rem 1rem', fontSize: '0.95rem', fontWeight: 600, border: '2px solid var(--color-border)', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--color-surface)', cursor: 'pointer', transition: 'all 0.2s' }}
                  >{s}</button>
                ))}
              </div>
              <textarea className="form-control" rows="5"
                placeholder={t('fields.symptoms_placeholder')}
                value={formData.symptoms}
                onChange={e => handleInputChange('symptoms', e.target.value)}
              ></textarea>
            </FieldGroup>
          </div>
        )}

        {/* ── STEP 5: Review ── */}
        {step === 5 && (
          <div className="flex flex-col gap-4">
            <SectionTitle title="Review & Submit" />

            {[
              {
                section: 'Patient Information',
                rows: [
                  ['Name', formData.name], ['Age', formData.age],
                  ['Gender', formData.gender], 
                  ...(formData.gender === 'female' ? [['Pregnant', formData.is_pregnant ? 'Yes' : 'No']] : []),
                  ['Weight / Height', `${formData.weight_kg || '--'} kg / ${formData.height_cm || '--'} cm`],
                ]
              },
              {
                section: 'Vitals',
                rows: [
                  ['Blood Pressure', `${formData.Systolic_BP || '--'} / ${formData.Diastolic_BP || '--'} mmHg`],
                  ['Blood Sugar (Fasting)', `${formData.Blood_Sugar_Fasting || '--'} mg/dL`],
                  ['Pulse', `${formData.pulse_rate || '--'} BPM`],
                  ['Body Temp', `${formData.Body_Temp_F || '--'} °F`],
                  ['SPO2', `${formData.SPO2 || '--'} %`],
                  ['Hemoglobin', `${formData.Hemoglobin_Level || '--'} g/dL`],
                  ['BMI', formData.bmi || '--'],
                ]
              },
              {
                section: 'Lifestyle & History',
                rows: [
                  ['Smoking', ['No', 'Yes', 'Former'][formData.smoking_status]],
                  ['Alcohol', formData.alcohol_use ? 'Yes' : 'No'],
                  ['Activity', ['Low', 'Moderate', 'High'][formData.physical_activity]],
                  ['Known Diabetic', formData.known_diabetic ? 'Yes' : 'No'],
                  ['Known Hypertensive', formData.known_hypertensive ? 'Yes' : 'No'],
                  ['On Medication', formData.on_medication ? 'Yes' : 'No'],
                  ['Acute Fever', formData.acute_fever_symptoms ? 'Yes' : 'No'],
                ]
              },
              {
                section: 'Medical',
                rows: [
                  ['Symptoms', formData.symptoms || 'None'],
                ]
              }
            ].map(({ section, rows }) => (
              <div key={section} style={{ border: '2px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '1rem' }}>
                <div style={{ padding: '0.75rem 1.25rem', backgroundColor: 'var(--color-background)', fontWeight: 800, fontSize: '1rem', borderBottom: '2px solid var(--color-border)' }}>
                  {section}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', padding: '1rem 1.25rem' }}>
                  {rows.map(([label, val]) => (
                    <div key={label} style={{ padding: '0.4rem 0' }}>
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>{label}: </span>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {!isOnline && (
              <div style={{ padding: '1rem', backgroundColor: 'var(--color-warning-bg)', color: '#b45309', borderRadius: 'var(--radius-md)', fontSize: '1rem', fontWeight: 700, border: '2px solid var(--color-warning-border)' }}>
                {t('alerts.offline_error')}
              </div>
            )}
          </div>
        )}

      </div>

      <div className="flex justify-between items-center">
        {step > 1
          ? <button className="btn btn-outline" onClick={handleBack}>{t('add_patient.back')}</button>
          : <div></div>
        }
        {step < TOTAL_STEPS
          ? <button className="btn btn-primary" onClick={handleNext}>{t('add_patient.next')}</button>
          : <button className="btn btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Processing...' : t('add_patient.submit')}
            </button>
        }
      </div>
    </div>
  );
};

export default AddPatient;
