import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import type { OnboardingFormValues } from '../../types/workflow';

export interface OnboardingFormProps {
  defaultValues?: Partial<OnboardingFormValues>;
  isSubmitting: boolean;
  onSubmit(values: OnboardingFormValues): Promise<void> | void;
  onComplete?: (workflowId: string) => void;
}

const industries = [
  'Agency & Services',
  'E-commerce & Retail',
  'SaaS & Technology',
  'Finance & Insurance',
  'Healthcare & MedTech',
  'Media & Entertainment',
  'Manufacturing & Industrial',
  'Other'
];

export function OnboardingForm({ defaultValues, isSubmitting, onSubmit, onComplete }: OnboardingFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<OnboardingFormValues>({
    defaultValues: {
      fullName: '',
      websiteUrl: '',
      industry: '',
      location: '',
      ...defaultValues
    }
  });

  useEffect(() => {
    if (defaultValues) {
      reset(defaultValues);
    }
  }, [defaultValues, reset]);

  return (
    <form className="onboarding-form" onSubmit={handleSubmit(onSubmit)}>
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
        <label htmlFor="industry">Industry</label>
        <select
          id="industry"
          defaultValue={defaultValues?.industry ?? ''}
          {...register('industry', { required: 'Select an industry' })}
        >
          <option value="" disabled>
            Select your industry
          </option>
          {industries.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {errors.industry && <span className="input-error">{errors.industry.message}</span>}
      </div>

      <div className="form-field">
        <label htmlFor="location">Primary market or location</label>
        <input
          id="location"
          type="text"
          placeholder="San Francisco, CA"
          {...register('location', { required: 'Location is required' })}
        />
        {errors.location && <span className="input-error">{errors.location.message}</span>}
      </div>

      <button className="primary-button" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting…' : 'Generate my intelligence report'}
      </button>
    </form>
  );
}

export default OnboardingForm;

