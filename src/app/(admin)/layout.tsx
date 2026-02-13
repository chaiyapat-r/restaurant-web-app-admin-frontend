"use client";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation"; // เพิ่ม usePathname เข้ามา
import {
	LayoutDashboard,
	Table as TableIcon,
	Layers,
	UtensilsCrossed,
	Settings2,
	LogOut,
	Menu,
	X
} from "lucide-react";

export default function TableLayout({
	children
}: {
	children: React.ReactNode;
}) {
	const [isOpen, setIsOpen] = useState(false);
	const router = useRouter();
	const pathname = usePathname(); // ดึง Path ปัจจุบัน เช่น "/dashboard" หรือ "/table"

	const handleLogout = () => {
		localStorage.removeItem("access_token");
		router.push("/login");
	};

	const menuItems = [
		{
			name: "Dashboard",
			icon: <LayoutDashboard size={20} />,
			href: "/dashboard"
		},
		{ name: "Tables", icon: <TableIcon size={20} />, href: "/tables" },
		{ name: "Categories", icon: <Layers size={20} />, href: "/categories" },
		{ name: "Menus", icon: <UtensilsCrossed size={20} />, href: "/menus" },
		{ name: "MenuOptions", icon: <Settings2 size={20} />, href: "/menuoptions" }
	];

	return (
		<div className="min-h-screen bg-gray-50 flex flex-col">
			{/* --- Top Navbar --- */}
			<header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30">
				<div className="flex items-center gap-4">
					<button
						onClick={() => setIsOpen(true)}
						className="p-2 hover:bg-gray-100 rounded-lg"
					>
						<Menu size={24} className="text-gray-600" />
					</button>
					<span className="font-bold text-gray-700 tracking-wide">ADMIN</span>
				</div>
				<button
					onClick={handleLogout}
					className="p-2 hover:bg-red-50 rounded-lg text-gray-600 hover:text-red-500 transition-colors"
				>
					<LogOut size={24} />
				</button>
			</header>

			{/* --- Sidebar Overlay --- */}
			{isOpen && (
				<div
					className="fixed inset-0 bg-black/40 z-40 transition-opacity"
					onClick={() => setIsOpen(false)}
				/>
			)}

			<aside
				className={`fixed top-0 left-0 h-full w-[280px] bg-white z-50 transform transition-transform duration-300 ease-in-out shadow-2xl ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
			>
				<div className="p-6 flex items-center justify-between border-b border-gray-100">
					<div className="flex items-center gap-3">
						<div className="w-2 h-6 bg-gray-800 rounded-full" />
						<span className="font-bold text-xl text-gray-800">ADMIN</span>
					</div>
					<button
						onClick={() => setIsOpen(false)}
						className="p-1 hover:bg-gray-100 rounded-full"
					>
						<X size={20} />
					</button>
				</div>

				<nav className="p-4 space-y-1">
					{menuItems.map((item) => {
						// ตรวจสอบว่า pathname ปัจจุบันตรงกับ href ของเมนูนี้หรือไม่
						const isActive = pathname === item.href;

						return (
							<button
								key={item.name}
								onClick={() => {
									router.push(item.href);
									setIsOpen(false);
								}}
								className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all ${
									isActive
										? "bg-gray-100 text-black font-semibold shadow-sm" // สไตล์เมื่อ Active
										: "text-gray-500 hover:bg-gray-50" // สไตล์ปกติ
								}`}
							>
								<div className={`${isActive ? "text-black" : "text-gray-400"}`}>
									{item.icon}
								</div>
								<span className="text-sm">{item.name}</span>
							</button>
						);
					})}
				</nav>
			</aside>

			{/* --- Page Content --- */}
			<main className="flex-1 p-6 md:p-10 2xl:p-16">
				<div className="max-w-[1400px] mx-auto">{children}</div>
			</main>
		</div>
	);
}
