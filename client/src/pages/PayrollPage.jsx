import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function PayrollPage() {
	const { user } = useAuth();
	const [tab, setTab] = useState('setup');
	const [companies, setCompanies] = useState([]);
	const [selectedCompany, setSelectedCompany] = useState('');
	const [employees, setEmployees] = useState([]);
	const [selectedEmployee, setSelectedEmployee] = useState('');
	const [designation, setDesignation] = useState('');
	const [baseSalary, setBaseSalary] = useState('');
	const [paidLeave, setPaidLeave] = useState('0');
	const [paidLeaveTypes, setPaidLeaveTypes] = useState([{ type: 'emergency', days: 0 }, { type: 'sick', days: 0 }, { type: 'vacation', days: 0 }]);
	const [effectiveFrom, setEffectiveFrom] = useState('');
	const [salaryHistory, setSalaryHistory] = useState([]);
	const [year, setYear] = useState(new Date().getFullYear());
	const [month, setMonth] = useState(new Date().getMonth()+1);
	const [monthly, setMonthly] = useState(null);
	const [msg, setMsg] = useState('');
	const [errMsg, setErrMsg] = useState('');
	const [overviewRows, setOverviewRows] = useState([]);
	const [overviewLoading, setOverviewLoading] = useState(false);
	const [empRows, setEmpRows] = useState([]);
	const [empLoading, setEmpLoading] = useState(false);
	// Employee self-view
	const isEmployeeView = (user?.role === 'EMPLOYEE' || user?.role === 'SUPERVISOR');
	const [myMonthlyData, setMyMonthlyData] = useState(null);
	const [myYear, setMyYear] = useState(new Date().getFullYear());
	const [myMonth, setMyMonth] = useState(new Date().getMonth()+1);
	// Company admin slip modal
	const [slipOpen, setSlipOpen] = useState(false);
	const [slipLoading, setSlipLoading] = useState(false);
	const [slipErr, setSlipErr] = useState('');
	const [slipData, setSlipData] = useState(null);
	const [slipUserName, setSlipUserName] = useState('');

	useEffect(() => {
		(async () => {
			try {
				if (user?.role === 'SUPER_ADMIN') {
					const { listCompanies } = await import('../services/companies.js');
					setCompanies(await listCompanies());
				}
			} catch {}
		})();
	}, [user?.role]);

	useEffect(() => {
		(async () => {
			try {
				setEmployees([]);
				setSelectedEmployee('');
				if (!user?.role) return;
				const { listUsers } = await import('../services/users.js');
				if (user.role === 'COMPANY_ADMIN') {
					setEmployees(await listUsers());
				} else if (user.role === 'SUPER_ADMIN' && selectedCompany) {
					setEmployees(await listUsers(selectedCompany));
				}
			} catch {}
		})();
	}, [user?.role, selectedCompany]);

	// Load my monthly slip automatically for employees
	useEffect(() => {
		(async () => {
			try {
				if (!isEmployeeView) return;
				setErrMsg(''); setMsg('');
				const { myMonthly } = await import('../services/payroll.js');
				setMyMonthlyData(await myMonthly(myYear, myMonth));
			} catch (e) {
				setMyMonthlyData(null);
				setErrMsg(e?.response?.data?.error || 'Failed to load payslip');
			}
		})();
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isEmployeeView, myYear, myMonth]);

	async function loadSalaryHistory(uid) {
		try {
			const { getUserSalary } = await import('../services/payroll.js');
			setSalaryHistory(await getUserSalary(uid));
		} catch {}
	}

	useEffect(() => {
		if (selectedEmployee) loadSalaryHistory(selectedEmployee);
	}, [selectedEmployee]);

	async function saveSalary(e) {
		e.preventDefault(); setMsg(''); setErrMsg('');
		if (!selectedEmployee) { setErrMsg('Select employee'); return; }
		const salaryValue = Number(baseSalary);
		if (!baseSalary || isNaN(salaryValue) || salaryValue <= 0) {
			setErrMsg('Base salary is required and must be greater than 0');
			return;
		}
		try {
			const { setUserSalary } = await import('../services/payroll.js');
			await setUserSalary(selectedEmployee, {
				designation,
				baseSalary: salaryValue,
				paidLeavePerMonth: Number(paidLeave) || 0,
				paidLeaveTypes: paidLeaveTypes.map(p=>({ type: p.type, days: Number(p.days)||0 })),
				effectiveFrom: effectiveFrom || new Date().toISOString(),
			});
			setMsg('Salary saved');
			setDesignation(''); setBaseSalary(''); setPaidLeave('0'); setPaidLeaveTypes([{ type: 'emergency', days: 0 }, { type: 'sick', days: 0 }, { type: 'vacation', days: 0 }]); setEffectiveFrom('');
			loadSalaryHistory(selectedEmployee);
		} catch (e) { setErrMsg(e?.response?.data?.error || 'Failed to save salary'); }
	}

	async function compute() {
		setMsg(''); setErrMsg(''); setMonthly(null);
		if (!selectedEmployee) { setErrMsg('Select employee'); return; }
		try {
			const { computeMonthly } = await import('../services/payroll.js');
			setMonthly(await computeMonthly(selectedEmployee, year, month));
		} catch (e) { setErrMsg(e?.response?.data?.error || 'Failed to compute'); }
	}

	async function openSlip(userId, displayName, y, m) {
		setSlipErr(''); setSlipData(null); setSlipOpen(true); setSlipLoading(true); setSlipUserName(displayName || userId);
		try {
			const { computeMonthly } = await import('../services/payroll.js');
			const data = await computeMonthly(userId, y, m);
			setSlipData(data);
		} catch (e) { setSlipErr(e?.response?.data?.error || 'Failed to load slip'); }
		finally { setSlipLoading(false); }
	}

	function formatCurrency(value) {
		try { return Number(value).toFixed(2); } catch { return String(value); }
	}

	const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

	async function downloadSalarySlipPDF(data, userData, year, month) {
		try {
			const { jsPDF } = await import('jspdf');
			const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
			const monthName = monthNames[month - 1];
			
			const doc = new jsPDF();
			const pageWidth = doc.internal.pageSize.getWidth();
			const pageHeight = doc.internal.pageSize.getHeight();
			const margin = 15;
			let yPos = margin;

			// Header
			doc.setFillColor(199, 154, 106); // Amber color
			doc.rect(0, 0, pageWidth, 40, 'F');
			doc.setTextColor(255, 255, 255);
			doc.setFontSize(20);
			doc.setFont('helvetica', 'bold');
			doc.text('SALARY SLIP', pageWidth / 2, 20, { align: 'center' });
			doc.setFontSize(12);
			doc.text(`${monthName} ${year}`, pageWidth / 2, 30, { align: 'center' });
			
			yPos = 50;
			doc.setTextColor(0, 0, 0);

			// Employee Details
			doc.setFontSize(14);
			doc.setFont('helvetica', 'bold');
			doc.text('Employee Details', margin, yPos);
			yPos += 8;
			doc.setFontSize(10);
			doc.setFont('helvetica', 'normal');
			doc.text(`Name: ${userData?.fullName || 'N/A'}`, margin, yPos);
			yPos += 6;
			doc.text(`Email: ${userData?.email || 'N/A'}`, margin, yPos);
			yPos += 6;
			doc.text(`Employee ID: ${userData?.id || 'N/A'}`, margin, yPos);
			yPos += 10;

			// Salary Details Box
			doc.setFillColor(250, 247, 240);
			doc.rect(margin, yPos, pageWidth - 2 * margin, 60, 'F');
			doc.setDrawColor(199, 154, 106);
			doc.rect(margin, yPos, pageWidth - 2 * margin, 60, 'S');
			
			const boxY = yPos + 5;
			doc.setFontSize(11);
			doc.setFont('helvetica', 'bold');
			doc.text('Salary Details', margin + 5, boxY);
			
			doc.setFontSize(9);
			doc.setFont('helvetica', 'normal');
			let detailY = boxY + 8;
			doc.text(`Base Salary: ₹${formatCurrency(data.baseSalary)}`, margin + 5, detailY);
			detailY += 6;
			doc.text(`Working Days: ${data.workingDays}`, margin + 5, detailY);
			detailY += 6;
			doc.text(`Paid Leave Allowed: ${data.paidLeaveAllowed} days`, margin + 5, detailY);
			detailY += 6;
			doc.text(`Leave Days Taken: ${data.leaveDays} days`, margin + 5, detailY);
			detailY += 6;
			doc.text(`Unpaid Leave Days: ${data.unpaidLeaveDays} days`, margin + 5, detailY);
			detailY += 6;
			doc.text(`Deduction: ₹${formatCurrency(data.deduction)}`, margin + 5, detailY);
			
			const rightX = pageWidth - margin - 5;
			detailY = boxY + 8;
			doc.setFont('helvetica', 'bold');
			doc.setFontSize(12);
			doc.text(`Net Payable: ₹${formatCurrency(data.payable)}`, rightX, detailY, { align: 'right' });
			
			yPos += 70;

			// Paid Leave Breakdown
			if ((data.allowedPerType?.length || data.usedPerType?.length)) {
				doc.setFontSize(11);
				doc.setFont('helvetica', 'bold');
				doc.text('Paid Leave Breakdown', margin, yPos);
				yPos += 8;
				
				const tableTop = yPos;
				const colWidths = [60, 40, 40, 50];
				const colX = [margin, margin + colWidths[0], margin + colWidths[0] + colWidths[1], margin + colWidths[0] + colWidths[1] + colWidths[2]];
				
				// Table Header
				doc.setFillColor(250, 235, 215);
				doc.rect(margin, tableTop, pageWidth - 2 * margin, 8, 'F');
				doc.setFontSize(9);
				doc.setFont('helvetica', 'bold');
				doc.text('Type', colX[0] + 2, tableTop + 6);
				doc.text('Allowed', colX[1] + 2, tableTop + 6);
				doc.text('Used', colX[2] + 2, tableTop + 6);
				doc.text('Remaining', colX[3] + 2, tableTop + 6);
				
				yPos = tableTop + 8;
				doc.setFont('helvetica', 'normal');
				const types = Array.from(new Set([...(data.allowedPerType||[]).map(x=>x.type), ...(data.usedPerType||[]).map(x=>x.type)]));
				types.forEach(t => {
					const a = (data.allowedPerType||[]).find(x=>x.type===t)?.days ?? 0;
					const u = (data.usedPerType||[]).find(x=>x.type===t)?.days ?? 0;
					const r = Math.max(0, a - u);
					doc.text(t.charAt(0).toUpperCase() + t.slice(1), colX[0] + 2, yPos + 4);
					doc.text(String(a), colX[1] + 2, yPos + 4);
					doc.text(String(u), colX[2] + 2, yPos + 4);
					doc.text(String(r), colX[3] + 2, yPos + 4);
					doc.setDrawColor(220, 220, 220);
					doc.line(margin, yPos, pageWidth - margin, yPos);
					yPos += 6;
				});
				yPos += 5;
			}

			// Holidays
			if (data.holidays && data.holidays.length > 0) {
				if (yPos > pageHeight - 40) {
					doc.addPage();
					yPos = margin;
				}
				doc.setFontSize(11);
				doc.setFont('helvetica', 'bold');
				doc.text('Holidays This Month', margin, yPos);
				yPos += 8;
				doc.setFontSize(9);
				doc.setFont('helvetica', 'normal');
				data.holidays.sort((a,b) => new Date(a.date) - new Date(b.date)).forEach(h => {
					const dateStr = new Date(h.date).toLocaleDateString();
					doc.text(`${dateStr}: ${h.label || 'Holiday'}`, margin + 5, yPos);
					yPos += 6;
				});
				yPos += 5;
			}

			// Footer
			const footerY = pageHeight - 20;
			doc.setFontSize(8);
			doc.setTextColor(128, 128, 128);
			doc.text('This is a computer-generated document and does not require a signature.', pageWidth / 2, footerY, { align: 'center' });
			doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, footerY + 6, { align: 'center' });

			// Save PDF
			const fileName = `Salary_Slip_${userData?.fullName?.replace(/\s+/g, '_') || 'Employee'}_${monthName}_${year}.pdf`;
			doc.save(fileName);
		} catch (e) {
			console.error('Failed to generate PDF', e);
			alert('Failed to generate PDF. Please try again.');
		}
	}

	if (isEmployeeView) {
		return (
			<div className="space-y-4">
				<h1 className="text-2xl font-bold">Payroll</h1>
				{msg && <div className="text-green-800 bg-green-50 border border-green-200 rounded p-2">{msg}</div>}
				{errMsg && <div className="text-red-800 bg-red-50 border border-red-200 rounded p-2">{errMsg}</div>}
				<div className="bg-white border border-amber-300 rounded p-4 grid gap-3">
					<div className="text-amber-900 font-medium">My Salary Slip</div>
					<div className="flex gap-2 items-center">
						<input type="number" className="border border-amber-300 rounded px-2 py-1 w-28 text-amber-900" value={myYear} onChange={(e)=>setMyYear(Number(e.target.value)||new Date().getFullYear())} />
						<select className="border border-amber-300 rounded px-2 py-1" value={myMonth} onChange={(e)=>setMyMonth(Number(e.target.value)||1)}>
							{monthNames.map((name, i)=>(<option key={i+1} value={i+1}>{name}</option>))}
						</select>
						<button onClick={async()=>{
							setErrMsg(''); setMsg('');
							try { const { myMonthly } = await import('../services/payroll.js'); setMyMonthlyData(await myMonthly(myYear, myMonth)); }
							catch (e) { setMyMonthlyData(null); setErrMsg(e?.response?.data?.error || 'Failed to load payslip'); }
						}} className="bg-amber-700 hover:bg-amber-800 text-white rounded px-3 py-1">Refresh</button>
					</div>
					{myMonthlyData && (
						<div className="grid gap-3">
							<div className="flex justify-end">
								<button onClick={() => downloadSalarySlipPDF(myMonthlyData, user, myYear, myMonth)} className="bg-amber-700 hover:bg-amber-800 text-white rounded px-4 py-2">
									📥 Download Salary Slip PDF
								</button>
							</div>
							<div className="grid md:grid-cols-3 gap-3">
								<div className="p-3 border border-amber-200 rounded"><div className="text-sm opacity-70">Base Salary</div><div className="text-xl font-semibold">{myMonthlyData.baseSalary}</div></div>
								<div className="p-3 border border-amber-200 rounded"><div className="text-sm opacity-70">Working Days</div><div className="text-xl font-semibold">{myMonthlyData.workingDays}</div></div>
								<div className="p-3 border border-amber-200 rounded"><div className="text-sm opacity-70">Paid Leave Allowed</div><div className="text-xl font-semibold">{myMonthlyData.paidLeaveAllowed}</div></div>
								<div className="p-3 border border-amber-200 rounded"><div className="text-sm opacity-70">Leave Days</div><div className="text-xl font-semibold">{myMonthlyData.leaveDays}</div></div>
								<div className="p-3 border border-amber-200 rounded"><div className="text-sm opacity-70">Unpaid Leave Days</div><div className="text-xl font-semibold">{myMonthlyData.unpaidLeaveDays}</div></div>
								<div className="p-3 border border-amber-200 rounded"><div className="text-sm opacity-70">Deduction</div><div className="text-xl font-semibold">{formatCurrency(myMonthlyData.deduction)}</div></div>
								<div className="p-3 border border-amber-200 rounded md:col-span-3"><div className="text-sm opacity-70">Payable</div><div className="text-2xl font-bold">{formatCurrency(myMonthlyData.payable)}</div></div>
							</div>
							{(myMonthlyData.allowedPerType?.length || myMonthlyData.usedPerType?.length) ? (
								<div>
									<div className="text-amber-900 font-medium mb-2">Paid Leave Breakdown</div>
									<table className="min-w-[600px] w-full">
										<thead>
											<tr className="bg-amber-50 text-amber-900">
												<th className="text-left p-2 border-b border-amber-200">Type</th>
												<th className="text-left p-2 border-b border-amber-200">Allowed</th>
												<th className="text-left p-2 border-b border-amber-200">Used</th>
												<th className="text-left p-2 border-b border-amber-200">Remaining</th>
											</tr>
										</thead>
										<tbody>
											{Array.from(new Set([...(myMonthlyData.allowedPerType||[]).map(x=>x.type), ...(myMonthlyData.usedPerType||[]).map(x=>x.type)])).map(t=>{
												const a=(myMonthlyData.allowedPerType||[]).find(x=>x.type===t)?.days ?? 0;
												const u=(myMonthlyData.usedPerType||[]).find(x=>x.type===t)?.days ?? 0;
												const r=Math.max(0, a - u);
												return (
													<tr key={t}>
														<td className="p-2 border-t border-amber-100 capitalize">{t}</td>
														<td className="p-2 border-t border-amber-100">{a}</td>
														<td className="p-2 border-t border-amber-100">{u}</td>
														<td className="p-2 border-t border-amber-100">{r}</td>
													</tr>
												);
											})}
										</tbody>
									</table>
								</div>
							) : null}

							<div>
								<div className="text-amber-900 font-medium mb-2">Holidays This Month</div>
								{(myMonthlyData.holidays||[]).length ? (
									<table className="min-w-[400px] w-full">
										<thead>
											<tr className="bg-amber-50 text-amber-900">
												<th className="text-left p-2 border-b border-amber-200">Date</th>
												<th className="text-left p-2 border-b border-amber-200">Label</th>
											</tr>
										</thead>
										<tbody>
											{[...myMonthlyData.holidays].sort((a,b)=> new Date(a.date) - new Date(b.date)).map(h => (
												<tr key={h.date+String(h.label||'')}>
													<td className="p-2 border-t border-amber-100">{new Date(h.date).toLocaleDateString()}</td>
													<td className="p-2 border-t border-amber-100">{h.label || '-'}</td>
												</tr>
											))}
										</tbody>
									</table>
								) : (
									<div className="text-sm opacity-70">No holidays this month.</div>
								)}
							</div>
						</div>
					)}
				</div>
			</div>
		);
	}

	const employeePicker = (
		<div className="flex gap-2 items-center">
			{user?.role === 'SUPER_ADMIN' && (
				<select value={selectedCompany} onChange={(e)=>{ setSelectedCompany(e.target.value); setSelectedEmployee(''); }} className="border border-amber-300 rounded px-2 py-1">
					<option value="">Select company</option>
					{companies.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
				</select>
			)}
			<select value={selectedEmployee} onChange={(e)=>setSelectedEmployee(e.target.value)} className="border border-amber-300 rounded px-2 py-1">
				<option value="">Select employee</option>
				{employees.map(u => <option key={u.id} value={u.id}>{u.fullName || u.email || u.id}</option>)}
			</select>
		</div>
	);

	const overviewContent = (
		<div className="bg-white border border-amber-300 rounded p-4 grid gap-3">
			<div className="text-amber-900 font-medium">Overview (Monthly)</div>
			<div className="flex flex-wrap gap-2 items-center">
				{user?.role === 'SUPER_ADMIN' && (
					<select value={selectedCompany} onChange={(e)=>{ setSelectedCompany(e.target.value); setOverviewRows([]); }} className="border border-amber-300 rounded px-2 py-1">
						<option value="">Select company</option>
						{companies.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
					</select>
				)}
				<input type="number" className="border border-amber-300 rounded px-2 py-1 w-28 text-amber-900" value={year} onChange={(e)=>setYear(Number(e.target.value))} />
				<select className="border border-amber-300 rounded px-2 py-1" value={month} onChange={(e)=>setMonth(Number(e.target.value))}>
					{monthNames.map((name, i)=>(<option key={i+1} value={i+1}>{name}</option>))}
				</select>
				<button onClick={async()=>{
					setErrMsg(''); setMsg(''); setOverviewLoading(true); setOverviewRows([]);
					try {
						let list = employees;
						if (user?.role === 'SUPER_ADMIN') {
							if (!selectedCompany) { setErrMsg('Select company'); setOverviewLoading(false); return; }
							const { listUsers } = await import('../services/users.js');
							list = await listUsers(selectedCompany);
						}
						const { computeMonthly } = await import('../services/payroll.js');
						const rows = [];
						for (const u of list) {
							try {
								const r = await computeMonthly(u.id, year, month);
								const remaining = Math.max(0, Number(r.paidLeaveAllowed||0) - Math.min(Number(r.leaveDays||0), Number(r.paidLeaveAllowed||0)));
								rows.push({ id: u.id, name: u.fullName || u.email || u.id, baseSalary: r.baseSalary, paidLeaveAllowed: r.paidLeaveAllowed, leaveDays: r.leaveDays, unpaidLeaveDays: r.unpaidLeaveDays, deduction: r.deduction, payable: r.payable, remainingPaidLeave: remaining });
							} catch (e) {
								rows.push({ id: u.id, name: u.fullName || u.email || u.id, error: (e?.response?.data?.error || 'No salary set') });
							}
						}
						setOverviewRows(rows);
					} finally {
						setOverviewLoading(false);
					}
				}} className="bg-amber-700 hover:bg-amber-800 text-white rounded px-3 py-1">Compute Overview</button>
			</div>
			<div className="overflow-x-auto">
				<table className="min-w-[1000px] w-full">
					<thead>
						<tr className="bg-amber-50 text-amber-900">
							<th className="text-left p-2 border-b border-amber-200">Employee</th>
							<th className="text-left p-2 border-b border-amber-200">Base Salary</th>
							<th className="text-left p-2 border-b border-amber-200">Allowed Paid</th>
							<th className="text-left p-2 border-b border-amber-200">Used</th>
							<th className="text-left p-2 border-b border-amber-200">Remaining</th>
							<th className="text-left p-2 border-b border-amber-200">Unpaid Days</th>
							<th className="text-left p-2 border-b border-amber-200">Deduction</th>
							<th className="text-left p-2 border-b border-amber-200">Payable</th>
							<th className="text-left p-2 border-b border-amber-200">Status</th>
							<th className="text-left p-2 border-b border-amber-200">Actions</th>
						</tr>
					</thead>
					<tbody>
						{overviewLoading
							? <tr><td className="p-2" colSpan={10}>Calculating...</td></tr>
							: overviewRows.map(r => (
								<tr key={r.id}>
									<td className="p-2 border-t border-amber-100">{r.name}</td>
									<td className="p-2 border-t border-amber-100">{r.baseSalary ?? '-'}</td>
									<td className="p-2 border-t border-amber-100">{r.paidLeaveAllowed ?? '-'}</td>
									<td className="p-2 border-t border-amber-100">{r.leaveDays ?? '-'}</td>
									<td className="p-2 border-t border-amber-100">{r.remainingPaidLeave ?? '-'}</td>
									<td className="p-2 border-t border-amber-100">{r.unpaidLeaveDays ?? '-'}</td>
									<td className="p-2 border-t border-amber-100">{typeof r.deduction === 'number' ? r.deduction.toFixed(2) : '-'}</td>
									<td className="p-2 border-t border-amber-100">{typeof r.payable === 'number' ? r.payable.toFixed(2) : '-'}</td>
									<td className="p-2 border-t border-amber-100">{r.error ? r.error : 'OK'}</td>
									<td className="p-2 border-t border-amber-100"><button onClick={()=>openSlip(r.id, r.name, year, month)} className="border border-amber-300 text-amber-900 rounded px-3 py-1">Slip</button></td>
								</tr>
							))}
					</tbody>
				</table>
			</div>
		</div>
	);

	const mainContent = (
		<div className="space-y-4">
			<h1 className="text-2xl font-bold">Payroll</h1>
			{msg && <div className="text-green-800 bg-green-50 border border-green-200 rounded p-2">{msg}</div>}
			{errMsg && <div className="text-red-800 bg-red-50 border border-red-200 rounded p-2">{errMsg}</div>}
			<div className="flex gap-2">
				<button onClick={()=>setTab('setup')} className={(tab==='setup'?'bg-amber-700 text-white':'border text-amber-900')+" rounded px-3 py-1 border-amber-300"}>Setup</button>
				<button onClick={()=>setTab('monthly')} className={(tab==='monthly'?'bg-amber-700 text-white':'border text-amber-900')+" rounded px-3 py-1 border-amber-300"}>Monthly Salary</button>
				<button onClick={()=>setTab('overview')} className={(tab==='overview'?'bg-amber-700 text-white':'border text-amber-900')+" rounded px-3 py-1 border-amber-300"}>Overview</button>
				<button onClick={()=>setTab('employees')} className={(tab==='employees'?'bg-amber-700 text-white':'border text-amber-900')+" rounded px-3 py-1 border-amber-300"}>Employees</button>
			</div>
			{tab==='setup' && <div className="bg-white border border-amber-300 rounded p-4">Setup tab - use Employees tab for now.</div>}

			{tab==='employees' && <div className="bg-white border border-amber-300 rounded p-4"><div className="text-amber-900 font-medium">Employees tab - Load Employees to edit.</div></div>}

			{tab==='monthly' && <div className="bg-white border border-amber-300 rounded p-4">Monthly tab - Compute to see slip.</div>}

			{/* Slip Modal - placeholder; full modal in separate render */}
			{slipOpen && <div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-[9999]" onClick={() => setSlipOpen(false)}><div className="bg-white rounded-lg p-4" onClick={e => e.stopPropagation()}>Salary Slip - {slipUserName} {slipLoading && 'Loading...'} {slipErr && slipErr} {slipData && <button onClick={() => downloadSalarySlipPDF(slipData, employees.find(e => e.id === slipData.userId) || ({}), year, month)}>Download PDF</button>} <button onClick={() => setSlipOpen(false)}>Close</button></div></div>}

			{tab==='overview' && overviewContent}
		</div>
	);
	return mainContent;
}

