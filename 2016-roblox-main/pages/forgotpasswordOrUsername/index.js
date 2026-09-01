import dynamic from 'next/dynamic';

const ForgotPassword = dynamic(
  () => import('./ForgotPassword'),
  { ssr: false }
);

export default ForgotPassword;