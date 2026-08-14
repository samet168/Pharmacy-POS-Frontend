import BackofficeLayout from '@/components/layout/BackofficeLayout';

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <BackofficeLayout>{children}</BackofficeLayout>;
}