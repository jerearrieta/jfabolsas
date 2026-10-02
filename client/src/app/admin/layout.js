import '@/styles/admin.css';

export const metadata = {
  title: 'JFA Bolsas – Panel',
  robots: { index: false },
};

export const viewport = { themeColor: '#5C4420' };

export default function AdminLayout({ children }) {
  return children;
}
