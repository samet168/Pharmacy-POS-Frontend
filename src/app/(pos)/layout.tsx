import PosLayout from '@/components/layout/PosLayout';

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PosLayout>{children}</PosLayout>;
}