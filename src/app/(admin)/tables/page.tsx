"use client";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { QRCodeSVG } from "qrcode.react";
import { X, Loader2 } from "lucide-react"; // เพิ่ม Loader2 มาทำ loading icon

interface OrderItem {
	id: number;
	menu: { name: string };
	quantity: number;
	priceAtTime: number;
}

interface TableSession {
	id: number;
	token: string;
	openedAt: string;
	orders: OrderItem[];
}

interface Table {
	id: string;
	number: string;
	currentToken: string | null;
	sessions: TableSession[];
}

export default function TablePage() {
	const [tables, setTables] = useState<Table[]>([]);
	const [loading, setLoading] = useState(true);

	// --- States สำหรับ Modal เปิดโต๊ะ ---
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedTable, setSelectedTable] = useState<Table | null>(null);
	const [generatedToken, setGeneratedToken] = useState("");

	// --- States สำหรับ Modal ปิดโต๊ะ (Billing) ---
	const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
	const [billingTable, setBillingTable] = useState<Table | null>(null);
	const [activeBillingSession, setActiveBillingSession] =
		useState<TableSession | null>(null);

	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		fetchTables();
	}, []);

	const fetchTables = async () => {
		try {
			const apiUrl = process.env.NEXT_PUBLIC_API_URL;
			const response = await fetch(`${apiUrl}/table`);
			if (!response.ok) throw new Error("Network response was not ok");
			const data = await response.json();
			setTables(data);
		} catch (error) {
			console.error("Failed to fetch tables:", error);
		} finally {
			setLoading(false);
		}
	};

	// --- Logic สำหรับการ "เปิด" โต๊ะ ---
	const handleOpenClick = (table: Table) => {
		setSelectedTable(table);
		setGeneratedToken(uuidv4());
		setIsModalOpen(true);
	};

	const handleConfirmOpen = async () => {
		if (!selectedTable) return;
		setIsSubmitting(true);
		try {
			const apiUrl = process.env.NEXT_PUBLIC_API_URL;
			const response = await fetch(`${apiUrl}/table-session/open`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${localStorage.getItem("access_token")}`
				},
				body: JSON.stringify({
					tableId: selectedTable.id,
					token: generatedToken
				})
			});
			if (!response.ok) throw new Error("Failed to open table");
			await fetchTables();
			setIsModalOpen(false);
		} catch (error) {
			alert("เกิดข้อผิดพลาดในการเปิดโต๊ะ");
		} finally {
			setIsSubmitting(false);
		}
	};

	// --- Logic สำหรับการ "ปิด" โต๊ะ (Billing) ---
	const handleCloseClick = async (table: Table) => {
		setIsSubmitting(true);
		try {
			const apiUrl = process.env.NEXT_PUBLIC_API_URL;
			// ดึงข้อมูลออเดอร์ล่าสุดของโต๊ะนี้จาก API ใหม่
			const response = await fetch(`${apiUrl}/orders/table/${table.id}`, {
				headers: {
					Authorization: `Bearer ${localStorage.getItem("access_token")}`
				}
			});

			if (!response.ok) throw new Error("ไม่สามารถดึงข้อมูลออเดอร์ล่าสุดได้");

			const latestSessionData = await response.json();

			setActiveBillingSession(latestSessionData);
			setBillingTable(table);
			setIsCloseModalOpen(true);
		} catch (error: any) {
			alert(error.message);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleConfirmClose = async () => {
		if (!billingTable) return;
		setIsSubmitting(true);
		try {
			const apiUrl = process.env.NEXT_PUBLIC_API_URL;
			const response = await fetch(`${apiUrl}/table-session/close`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${localStorage.getItem("access_token")}`
				},
				body: JSON.stringify({ tableId: billingTable.id })
			});
			if (!response.ok) throw new Error("Failed to close table");
			await fetchTables();
			setIsCloseModalOpen(false);
			setActiveBillingSession(null);
		} catch (error) {
			alert("เกิดข้อผิดพลาดในการปิดโต๊ะ");
		} finally {
			setIsSubmitting(false);
		}
	};

	const calculateTotal = (orders: OrderItem[]) => {
		return orders.reduce(
			(sum, item) => sum + item.quantity * item.priceAtTime,
			0
		);
	};

	const availableCount = tables.filter((t) => !t.currentToken).length;
	const activeCount = tables.filter((t) => t.currentToken).length;

	// ดึงค่า Base URL จาก Config
	const webBaseUrl =
		process.env.NEXT_PUBLIC_WEB_FRONTEND_URL || "http://localhost:3002";

	// สร้าง QR URL ใหม่ให้ชี้ไปที่ /order/[tableNumber]
	const qrUrl = `${webBaseUrl}/order/${selectedTable?.number}?token=${generatedToken}`;

	if (loading)
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<Loader2 className="animate-spin h-10 w-10 text-gray-400" />
			</div>
		);

	return (
		<div className="relative">
			<div className="space-y-8">
				{/* Summary Badge */}
				<div className="flex gap-6 items-center border-b border-gray-100 pb-6">
					<div className="flex items-center gap-2">
						<span className="text-blue-600 text-sm font-medium">Available</span>
						<span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-md font-bold">
							{availableCount}
						</span>
					</div>
					<div className="flex items-center gap-2">
						<span className="text-orange-500 text-sm font-medium">Active</span>
						<span className="bg-orange-500 text-white text-xs px-3 py-1 rounded-md font-bold">
							{activeCount}
						</span>
					</div>
				</div>

				{/* Tables Grid */}
				<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-6">
					{tables.map((table: Table) => {
						const isAvailable = !table.currentToken;
						return (
							<div
								key={table.id}
								onClick={() =>
									!isSubmitting &&
									(isAvailable
										? handleOpenClick(table)
										: handleCloseClick(table))
								}
								className={`aspect-[4/3] rounded-2xl flex flex-col items-center justify-center transition-all shadow-sm border border-transparent hover:shadow-md cursor-pointer relative overflow-hidden ${
									isAvailable ? "bg-[#E5E7EB]" : "bg-[#FFF2E5]"
								}`}
							>
								{/* Overlay loading ขณะกำลังดึงข้อมูลออเดอร์ */}
								{isSubmitting && billingTable?.id === table.id && (
									<div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
										<Loader2 className="animate-spin text-orange-500" />
									</div>
								)}

								<span
									className={`text-5xl font-bold mb-8 ${isAvailable ? "text-[#4B5563]" : "text-[#E67E22]"}`}
								>
									{table.number}
								</span>
								<button
									className={`w-3/4 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-sm active:scale-95 ${
										isAvailable
											? "bg-[#4E89C4] hover:bg-[#3d6fa1]"
											: "bg-[#E67E22] hover:bg-[#cf711f]"
									}`}
								>
									{isAvailable ? "Open" : "Close"}
								</button>
							</div>
						);
					})}
				</div>
			</div>

			{/* --- Modal 1: Open Table (QR) --- */}
			{isModalOpen && (
				<div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
					<div
						className="absolute inset-0 bg-black/40 backdrop-blur-sm"
						onClick={() => !isSubmitting && setIsModalOpen(false)}
					/>
					<div className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl p-10 flex flex-col items-center animate-in fade-in zoom-in duration-200">
						<button
							onClick={() => setIsModalOpen(false)}
							className="absolute top-5 right-5 text-gray-400 hover:text-gray-600"
						>
							<X size={24} />
						</button>
						<h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
							Confirm open table {selectedTable?.number} ?
						</h2>
						<div className="bg-white p-4 rounded-2xl border-4 border-gray-50 mb-4 shadow-inner">
							<QRCodeSVG value={qrUrl} size={220} />
						</div>
						<p className="text-blue-500 text-[10px] underline mb-10 break-all text-center max-w-xs opacity-70">
							{qrUrl}
						</p>
						<div className="flex gap-4 w-full">
							<button
								onClick={() => setIsModalOpen(false)}
								disabled={isSubmitting}
								className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold hover:bg-gray-200 transition-all"
							>
								Cancel
							</button>
							<button
								onClick={handleConfirmOpen}
								disabled={isSubmitting}
								className="flex-1 py-4 bg-[#4E89C4] text-white rounded-2xl font-bold hover:bg-[#3d6fa1] transition-all shadow-lg shadow-blue-200"
							>
								{isSubmitting ? "Opening..." : "Confirm & Print QR"}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* --- Modal 2: Close Table (Billing) --- */}
			{isCloseModalOpen && billingTable && activeBillingSession && (
				<div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
					<div
						className="absolute inset-0 bg-black/40 backdrop-blur-sm"
						onClick={() => !isSubmitting && setIsCloseModalOpen(false)}
					/>
					<div className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-8 animate-in fade-in zoom-in duration-200">
						<button
							onClick={() => setIsCloseModalOpen(false)}
							className="absolute top-5 right-5 text-gray-400 hover:text-gray-600"
						>
							<X size={24} />
						</button>
						<div className="space-y-6">
							<div>
								<h2 className="text-2xl font-bold text-gray-800">
									Table {billingTable.number}
								</h2>
								<p className="text-sm text-gray-400">
									Opened at:{" "}
									{activeBillingSession.openedAt
										? new Date(activeBillingSession.openedAt).toLocaleString(
												"th-TH"
											)
										: "-"}
								</p>
								<p className="text-sm text-gray-400">
									Session: {activeBillingSession.token}
								</p>
							</div>
							<div className="max-h-[300px] overflow-y-auto pr-2">
								<table className="w-full text-sm text-left">
									<thead className="text-gray-400 border-b italic">
										<tr className="border-b">
											<th className="py-2 font-medium">Menu</th>
											<th className="py-2 font-medium text-center">Qty</th>
											<th className="py-2 font-medium text-right">Price</th>
										</tr>
									</thead>
									<tbody className="text-gray-600">
										{activeBillingSession.orders &&
										activeBillingSession.orders.length > 0 ? (
											activeBillingSession.orders.map((item: any) => (
												<tr key={item.id} className="border-b border-gray-50">
													<td className="py-3 font-medium">{item.menu.name}</td>
													<td className="py-3 text-center">x{item.quantity}</td>
													<td className="py-3 text-right">
														{(
															item.priceAtTime * item.quantity
														).toLocaleString()}
													</td>
												</tr>
											))
										) : (
											<tr>
												<td
													colSpan={3}
													className="py-10 text-center text-gray-400"
												>
													No orders
												</td>
											</tr>
										)}
									</tbody>
								</table>
							</div>
							<div className="flex justify-between items-center border-t border-dashed pt-4">
								<span className="text-lg font-bold text-gray-500">
									Grand Total
								</span>
								<span className="text-3xl font-extrabold text-gray-900">
									฿
									{calculateTotal(
										activeBillingSession.orders || []
									).toLocaleString()}
								</span>
							</div>
							<div className="flex gap-4 pt-2">
								<button
									onClick={() => setIsCloseModalOpen(false)}
									disabled={isSubmitting}
									className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold hover:bg-gray-200 transition-all"
								>
									Cancel
								</button>
								<button
									onClick={handleConfirmClose}
									disabled={isSubmitting}
									className="flex-1 py-4 bg-[#E67E22] text-white rounded-2xl font-bold hover:bg-[#cf711f] transition-all shadow-lg shadow-orange-100"
								>
									{isSubmitting ? "Closing..." : "Confirm"}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
