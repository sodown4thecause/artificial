import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';

import type { OnboardingFormValues } from '../../types/workflow';
import './OnboardingForm.css';

export interface OnboardingFormProps {
  defaultValues?: Partial<OnboardingFormValues>;
  isSubmitting: boolean;
  onSubmit(values: OnboardingFormValues): Promise<void> | void;
  onComplete?: (workflowId: string) => void;
}

export function OnboardingForm({ defaultValues, isSubmitting, onSubmit, onComplete }: OnboardingFormProps) {
  const [keywordInput, setKeywordInput] = useState('');
  const [competitorInput, setCompetitorInput] = useState('');
  
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    formState: { errors }
  } = useForm<OnboardingFormValues>({
    defaultValues: {
      fullName: '',
      websiteUrl: '',
      industry: '',
      location: '',
      targetKeywords: [],
      competitorDomains: [],
      ...defaultValues
    }
  });

  const targetKeywords = watch('targetKeywords') || [];
  const competitorDomains = watch('competitorDomains') || [];

  useEffect(() => {
    if (defaultValues) {
      reset(defaultValues);
    }
  }, [defaultValues, reset]);
  
  const addKeyword = () => {
    if (keywordInput.trim() && !targetKeywords.includes(keywordInput.trim())) {
      setValue('targetKeywords', [...targetKeywords, keywordInput.trim()]);
      setKeywordInput('');
    }
  };
  
  const removeKeyword = (keyword: string) => {
    setValue('targetKeywords', targetKeywords.filter(k => k !== keyword));
  };
  
  const addCompetitor = () => {
    if (competitorInput.trim() && !competitorDomains.includes(competitorInput.trim())) {
      setValue('competitorDomains', [...competitorDomains, competitorInput.trim()]);
      setCompetitorInput('');
    }
  };
  
  const removeCompetitor = (competitor: string) => {
    setValue('competitorDomains', competitorDomains.filter(c => c !== competitor));
  };
  
  const handleKeywordKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeyword();
    }
  };
  
  const handleCompetitorKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCompetitor();
    }
  };

  return (
    <form className="onboarding-form" onSubmit={handleSubmit(onSubmit)}>
      <div className="form-section">
        <h3>Basic Information</h3>
        
        <div className="form-field">
          <label htmlFor="fullName">Full name</label>
          <input
            id="fullName"
            type="text"
            placeholder="Alex Morgan"
            {...register('fullName', { required: 'Full name is required' })}
          />
          {errors.fullName && <span className="input-error">{errors.fullName.message}</span>}
        </div>

        <div className="form-field">
          <label htmlFor="websiteUrl">Website URL</label>
          <input
            id="websiteUrl"
            type="url"
            placeholder="https://www.yourdomain.com"
            {...register('websiteUrl', {
              required: 'Website is required',
              pattern: {
                value: /^(https?:\/\/)[\w.-]+(\.[\w.-]+)+(\/[^\s]*)?$/i,
                message: 'Provide a valid URL including protocol'
              }
            })}
          />
          {errors.websiteUrl && <span className="input-error">{errors.websiteUrl.message}</span>}
        </div>

        <div className="form-field">
          <label htmlFor="industry">Industry or Business Type</label>
          <input
            id="industry"
            type="text"
            placeholder="e.g., Digital Marketing, E-commerce, SaaS, Healthcare"
            {...register('industry', { required: 'Industry is required' })}
          />
          {errors.industry && <span className="input-error">{errors.industry.message}</span>}
          <small className="field-hint">Describe your business type or industry</small>
        </div>

        <div className="form-field">
          <label htmlFor="location">Primary market or location</label>
          <input
            id="location"
            type="text"
            placeholder="San Francisco, CA or United States"
            {...register('location', { required: 'Location is required' })}
          />
          {errors.location && <span className="input-error">{errors.location.message}</span>}
        </div>
      </div>

      <div className="form-section">
        <h3>Target Keywords <span className="optional">(Optional)</span></h3>
        <p className="section-description">
          Add keywords you want to track and rank for. Our AI will discover additional opportunities.
        </p>
        
        <div className="form-field">
          <label htmlFor="keywordInput">Add target keywords</label>
          <div className="input-with-button">
            <input
              id="keywordInput"
              type="text"
              placeholder="e.g., digital marketing agency, SEO services"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyPress={handleKeywordKeyPress}
            />
            <button type="button" onClick={addKeyword} disabled={!keywordInput.trim()}>
              Add
            </button>
          </div>
          <small className="field-hint">Press Enter or click Add to include a keyword</small>
        </div>
        
        {targetKeywords.length > 0 && (
          <div className="tags-container">
            <label>Target Keywords ({targetKeywords.length})</label>
            <div className="tags">
              {targetKeywords.map((keyword) => (
                <span key={keyword} className="tag">
                  {keyword}
                  <button type="button" onClick={() => removeKeyword(keyword)}>
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="form-section">
        <h3>Competitor Analysis <span className="optional">(Optional)</span></h3>
        <p className="section-description">
          Add known competitors. Our AI will automatically discover additional competitors in your market.
        </p>
        
        <div className="form-field">
          <label htmlFor="competitorInput">Add competitor websites</label>
          <div className="input-with-button">
            <input
              id="competitorInput"
              type="text"
              placeholder="e.g., competitor.com, industry-leader.com"
              value={competitorInput}
              onChange={(e) => setCompetitorInput(e.target.value)}
              onKeyPress={handleCompetitorKeyPress}
            />
            <button type="button" onClick={addCompetitor} disabled={!competitorInput.trim()}>
              Add
            </button>
          </div>
          <small className="field-hint">Enter domain names without http:// (Press Enter or click Add)</small>
        </div>
        
        {competitorDomains.length > 0 && (
          <div className="tags-container">
            <label>Competitors ({competitorDomains.length})</label>
            <div className="tags">
              {competitorDomains.map((competitor) => (
                <span key={competitor} className="tag">
                  {competitor}
                  <button type="button" onClick={() => removeCompetitor(competitor)}>
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="form-actions">
        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Generating Intelligence Report…' : 'Generate My Intelligence Report'}
        </button>
        <p className="submit-hint">
          This will analyze your website, competitors, and market to create a comprehensive intelligence report.
        </p>
      </div>
    </form>
  );
}

export default OnboardingForm;

