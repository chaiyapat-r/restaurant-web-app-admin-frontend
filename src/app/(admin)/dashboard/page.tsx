"use client";
import { useEffect, useState } from "react";

// ปรับ Interface ให้ตรงกับ include ของ Prisma ใน Backend
interface OrderOption {
	id: number;
	optionGroup: string;
	optionChoice: string;
}

interface Order {
	id: number;
	session: {
		table: {
			number: string;
		};
	};
	menu: {
		name: string;
	};
	quantity: number;
	status: string;
	remark: string | null;
	createdAt: string;
	options: OrderOption[];
}

export default function DashboardPage() {
	const [orders, setOrders] = useState<Order[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchOrders();
		const interval = setInterval(fetchOrders, 10000); // Auto-refresh ทุก 10 วินาที
		return () => clearInterval(interval);
	}, []);

	const fetchOrders = async () => {
		try {
			const apiUrl = process.env.NEXT_PUBLIC_API_URL;
			const response = await fetch(`${apiUrl}/orders`, {
				headers: {
					Authorization: `Bearer ${localStorage.getItem("access_token")}`
				}
			});
			if (!response.ok) throw new Error("Failed to fetch");
			const data = await response.json();
			setOrders(data);
		} catch (error) {
			console.error("Fetch error:", error);
		} finally {
			setLoading(false);
		}
	};

	const updateStatus = async (orderId: number, nextStatus: string) => {
		try {
			const apiUrl = process.env.NEXT_PUBLIC_API_URL;
			const response = await fetch(`${apiUrl}/orders/${orderId}/status`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${localStorage.getItem("access_token")}`
				},
				body: JSON.stringify({ status: nextStatus })
			});

			if (response.ok) {
				fetchOrders(); // Refresh ทันทีเมื่ออัปเดตสำเร็จ
			}
		} catch (error) {
			alert("ไม่สามารถอัปเดตสถานะได้");
		}
	};

	const renderColumn = (
		title: string,
		currentStatus: string,
		nextStatus: string | null,
		btnLabel: string
	) => {
		const filteredOrders = orders.filter((o) => o.status === currentStatus);

		return (
			<div className="flex-1 bg-gray-100/50 rounded-2xl flex flex-col min-h-[85vh] border border-gray-200 shadow-inner">
				<div className="p-5 border-b border-gray-200">
					<div className="flex justify-between items-center">
						<h2 className="text-lg font-black text-gray-700 uppercase">
							{title}
						</h2>
						<span className="bg-white px-3 py-1 rounded-full text-xs font-bold shadow-sm border text-gray-500">
							{filteredOrders.length}
						</span>
					</div>
				</div>

				<div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[75vh] scrollbar-hide">
					{filteredOrders.map((order) => (
						<div
							key={order.id}
							className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3 transition-all hover:shadow-md animate-in fade-in slide-in-from-bottom-2"
						>
							<div className="flex justify-between items-start">
								<div className="flex flex-col">
									{/* การเข้าถึงเลขโต๊ะผ่าน tableSession */}
									<span className="text-xl font-black text-[#4B5563]">
										Table {order.session.table.number}
									</span>
									<span className="text-[11px] text-gray-400 font-medium">
										{new Date(order.createdAt).toLocaleString("th-TH")}
									</span>
								</div>

								{nextStatus && (
									<button
										onClick={() => updateStatus(order.id, nextStatus)}
										className={`px-5 py-2 rounded-xl text-xs font-extrabold text-white transition-all active:scale-90 shadow-sm ${
											currentStatus === "PENDING"
												? "bg-[#4E89C4] hover:bg-[#3d6fa1]"
												: "bg-[#427D5D] hover:bg-[#35634a]"
										}`}
									>
										{btnLabel}
									</button>
								)}

								{/* เคสสำหรับสถานะสุดท้าย */}
								{!nextStatus && currentStatus === "READY TO SERVE" && (
									<button
										onClick={() => updateStatus(order.id, "SERVED")}
										className="px-5 py-2 rounded-xl text-xs font-extrabold text-white bg-[#E67E22] hover:bg-[#cf711f] transition-all active:scale-90 shadow-sm"
									>
										Done
									</button>
								)}
							</div>

							<div className="pt-2">
								<p className="text-md font-bold text-gray-700 flex justify-between">
									<span>{order.menu.name}</span>
									<span className="text-[#4E89C4] bg-blue-50 px-2 rounded-md">
										x{order.quantity}
									</span>
								</p>

								{/* Options List */}
								{order.options && order.options.length > 0 && (
									<div className="mt-2 py-2 px-3 bg-gray-50 rounded-xl space-y-1">
										{order.options.map((opt) => (
											<p
												key={opt.id}
												className="text-[12px] text-gray-500 flex items-center gap-2"
											>
												<span className="w-1 h-1 bg-gray-300 rounded-full"></span>
												<span className="font-semibold">
													{opt.optionGroup}:
												</span>{" "}
												{opt.optionChoice}
											</p>
										))}
									</div>
								)}

								{/* Remark */}
								{order.remark && (
									<div className="mt-3 flex gap-2 items-start text-red-500 bg-red-50 p-2 rounded-lg border border-red-100">
										<span className="text-[11px] font-bold uppercase shrink-0">
											Note:
										</span>
										<p className="text-[12px] leading-tight font-medium">
											{order.remark}
										</p>
									</div>
								)}
							</div>
						</div>
					))}
				</div>
			</div>
		);
	};

	if (loading)
		return (
			<div className="flex items-center justify-center h-screen bg-gray-50">
				<div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
			</div>
		);

	return (
		<div className="p-4 bg-white min-h-screen">
			<div className="max-w-[1600px] mx-auto">
				<div className="flex flex-col md:flex-row gap-6">
					{renderColumn("Pending", "PENDING", "COOKING", "Start Cooking")}
					{renderColumn(
						"Cooking",
						"COOKING",
						"READY TO SERVE",
						"Ready to Serve"
					)}
					{renderColumn("Ready to Serve", "READY TO SERVE", null, "Complete")}
				</div>
			</div>
		</div>
	);
}
