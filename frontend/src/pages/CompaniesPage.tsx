export default function CompaniesPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold mb-3">Companies</h1>
      <div className="grid gap-3">
        {[1,2,3].map((i) => (
          <div key={i} className="border rounded p-3">Company {i}</div>
        ))}
      </div>
    </div>
  );
}