export function StaffLoginLink({ children = 'Staff login', className, onClick }) {
  return (
    <a href="/admin/login" target="_blank" rel="noopener noreferrer" className={className} onClick={onClick}>
      {children}
    </a>
  );
}
