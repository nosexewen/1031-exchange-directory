import LeadModal from './LeadModal';

export default function ProviderIntake({providers}:{providers:{id:string;name:string;url:string}[]}) {
  const id = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('provider');
  const provider = providers.find(p => p.id === id);

  return (
    <section className="card">
      <h2>{provider ? 'Intake interest: ' + provider.name : 'General directory intake'}</h2>
      <p>This submits interest to the directory operator. It does not establish a provider relationship or transmit your information to a provider.</p>
      <LeadModal buttonText="Request Intake" providerId={provider?.id} />
    </section>
  );
}
