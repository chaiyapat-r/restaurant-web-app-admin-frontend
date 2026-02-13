"use client";
import { useEffect, useState } from "react";
import {
	Plus,
	ChevronLeft,
	ChevronRight,
	X,
	Loader2,
	Edit2,
	Trash2,
	AlertCircle,
	Settings2,
	ListTree
} from "lucide-react";

// --- Interfaces ---
interface OptionGroup {
	id: number;
	name: string;
	isRequired: boolean;
	disable: boolean;
}

interface OptionChoice {
	id: number;
	name: string;
	optionGroupId: number;
	optionGroup?: OptionGroup;
	disable: boolean;
}

type TabType = "GROUP" | "CHOICE";

export default function MenuOptionsPage() {
	const [activeTab, setActiveTab] = useState<TabType>("GROUP");
	const [loading, setLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Data States
	const [groups, setGroups] = useState<OptionGroup[]>([]);
	const [choices, setChoices] = useState<OptionChoice[]>([]);

	// Modal States
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [editingItem, setEditingItem] = useState<any>(null);
	const [deletingItem, setDeletingItem] = useState<any>(null);

	// Form States
	const [name, setName] = useState("");
	const [isRequired, setIsRequired] = useState("false");
	const [disable, setDisable] = useState("false");
	const [selectedGroupId, setSelectedGroupId] = useState("");

	// Pagination States
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 8;

	useEffect(() => {
		fetchData();
	}, [activeTab]);

	const fetchData = async () => {
		setLoading(true);
		try {
			const apiUrl = process.env.NEXT_PUBLIC_API_URL;
			const endpoint =
				activeTab === "GROUP" ? "option-groups" : "option-choices";

			const response = await fetch(`${apiUrl}/${endpoint}`, {
				headers: {
					Authorization: `Bearer ${localStorage.getItem("access_token")}`
				}
			});
			const data = await response.json();

			if (activeTab === "GROUP") {
				setGroups(Array.isArray(data) ? data : []);
			} else {
				setChoices(Array.isArray(data) ? data : []);
				// โหลด Groups มาไว้ใช้ใน Dropdown สำหรับหน้า Choice
				const groupRes = await fetch(`${apiUrl}/option-groups`, {
					headers: {
						Authorization: `Bearer ${localStorage.getItem("access_token")}`
					}
				});
				const groupData = await groupRes.json();
				setGroups(Array.isArray(groupData) ? groupData : []);
			}
		} catch (error) {
			console.error("Fetch error:", error);
		} finally {
			setLoading(false);
		}
	};

	// --- Modal Logic ---
	const handleAddClick = () => {
		setEditingItem(null);
		setName("");
		setIsRequired("false");
		setDisable("false");
		setSelectedGroupId(groups[0]?.id.toString() || "");
		setIsModalOpen(true);
	};

	const handleEditClick = (item: any) => {
		setEditingItem(item);
		setName(item.name);
		setDisable(item.disable.toString());
		if (activeTab === "GROUP") {
			setIsRequired(item.isRequired.toString());
		} else {
			setSelectedGroupId(item.optionGroupId.toString());
		}
		setIsModalOpen(true);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		try {
			const apiUrl = process.env.NEXT_PUBLIC_API_URL;
			const endpoint =
				activeTab === "GROUP" ? "option-groups" : "option-choices";
			const method = editingItem ? "PATCH" : "POST";
			const url = editingItem
				? `${apiUrl}/${endpoint}/${editingItem.id}`
				: `${apiUrl}/${endpoint}`;

			const bodyData =
				activeTab === "GROUP"
					? {
							name,
							isRequired: isRequired === "true",
							disable: disable === "true"
						}
					: {
							name,
							optionGroupId: Number(selectedGroupId),
							disable: disable === "true"
						};

			const response = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${localStorage.getItem("access_token")}`
				},
				body: JSON.stringify(bodyData)
			});

			if (response.ok) {
				setIsModalOpen(false);
				fetchData();
			}
		} catch (error) {
			alert("Error saving data");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteConfirm = async () => {
		if (!deletingItem) return;
		setIsSubmitting(true);
		try {
			const apiUrl = process.env.NEXT_PUBLIC_API_URL;
			const endpoint =
				activeTab === "GROUP" ? "option-groups" : "option-choices";
			await fetch(`${apiUrl}/${endpoint}/${deletingItem.id}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${localStorage.getItem("access_token")}`
				}
			});
			setIsDeleteModalOpen(false);
			fetchData();
		} catch (error) {
			alert("Delete failed");
		} finally {
			setIsSubmitting(false);
		}
	};

	// Pagination Logic
	const currentData = activeTab === "GROUP" ? groups : choices;
	const indexOfLastItem = currentPage * itemsPerPage;
	const indexOfFirstItem = indexOfLastItem - itemsPerPage;
	const currentItems = currentData.slice(indexOfFirstItem, indexOfLastItem);
	const totalPages = Math.ceil(currentData.length / itemsPerPage);

	return (
		<div className="space-y-6">
			{/* Tab Switcher & Header */}
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
				<div className="bg-gray-100 p-1.5 rounded-2xl flex gap-1">
					<button
						onClick={() => {
							setActiveTab("GROUP");
							setCurrentPage(1);
						}}
						className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
							activeTab === "GROUP"
								? "bg-white text-gray-800 shadow-sm"
								: "text-gray-500 hover:text-gray-700"
						}`}
					>
						<Settings2 size={18} /> Option Group
					</button>
					<button
						onClick={() => {
							setActiveTab("CHOICE");
							setCurrentPage(1);
						}}
						className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
							activeTab === "CHOICE"
								? "bg-white text-gray-800 shadow-sm"
								: "text-gray-500 hover:text-gray-700"
						}`}
					>
						<ListTree size={18} /> Option Choice
					</button>
				</div>

				<button
					onClick={handleAddClick}
					className="bg-[#4E89C4] hover:bg-[#3d6fa1] text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-100"
				>
					<Plus size={20} /> Add {activeTab === "GROUP" ? "Group" : "Choice"}
				</button>
			</div>

			{/* Table Section */}
			<div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
				{loading ? (
					<div className="p-20 flex justify-center">
						<Loader2 className="animate-spin text-gray-300" size={40} />
					</div>
				) : (
					<table className="w-full text-left">
						<thead className="bg-gray-50/50 border-b border-gray-100">
							<tr>
								<th className="px-8 py-5 text-sm font-semibold text-gray-600">
									ID
								</th>
								<th className="px-8 py-5 text-sm font-semibold text-gray-600">
									Name
								</th>
								{activeTab === "GROUP" ? (
									<th className="px-8 py-5 text-sm font-semibold text-gray-600">
										Required
									</th>
								) : (
									<th className="px-8 py-5 text-sm font-semibold text-gray-600">
										Group
									</th>
								)}
								<th className="px-8 py-5 text-sm font-semibold text-gray-600">
									Status
								</th>
								<th className="px-8 py-5 text-sm font-semibold text-gray-600 text-right">
									Actions
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-50">
							{currentItems.map((item: any) => (
								<tr
									key={item.id}
									className="hover:bg-gray-50/50 transition-colors"
								>
									<td className="px-8 py-5 text-sm text-gray-500 font-medium">
										#{item.id}
									</td>
									<td className="px-8 py-5">
										<span className="text-sm font-bold text-gray-700">
											{item.name}
										</span>
									</td>
									{activeTab === "GROUP" ? (
										<td className="px-8 py-5">
											<span
												className={`px-3 py-1 rounded-full text-[11px] font-bold ${item.isRequired ? "bg-blue-50 text-blue-600 border border-blue-100" : "bg-gray-50 text-gray-400 border border-gray-100"}`}
											>
												{item.isRequired ? "REQUIRED" : "OPTIONAL"}
											</span>
										</td>
									) : (
										<td className="px-8 py-5 text-sm text-gray-500">
											{item.optionGroup?.name || "-"}
										</td>
									)}
									<td className="px-8 py-5">
										<span
											className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
												item.disable
													? "bg-red-50 text-red-500 border border-red-100"
													: "bg-green-50 text-green-600 border border-green-100"
											}`}
										>
											{item.disable ? "Disabled" : "Active"}
										</span>
									</td>
									<td className="px-8 py-5 text-right">
										<div className="flex justify-end gap-2">
											<button
												onClick={() => handleEditClick(item)}
												className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
											>
												<Edit2 size={18} />
											</button>
											<button
												onClick={() => {
													setDeletingItem(item);
													setIsDeleteModalOpen(true);
												}}
												className="p-2 text-gray-400 hover:text-red-500 transition-colors"
											>
												<Trash2 size={18} />
											</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}

				{/* Empty State */}
				{!loading && currentData.length === 0 && (
					<div className="p-20 text-center text-gray-400 font-medium">
						No records found.
					</div>
				)}

				{/* Pagination Section */}
				<div className="px-8 py-5 bg-white border-t border-gray-50 flex items-center justify-between">
					<p className="text-sm text-gray-500 font-medium">
						Showing{" "}
						<span className="text-gray-900">
							{currentData.length > 0 ? indexOfFirstItem + 1 : 0}
						</span>{" "}
						to{" "}
						<span className="text-gray-900">
							{Math.min(indexOfLastItem, currentData.length)}
						</span>{" "}
						of <span className="text-gray-900">{currentData.length}</span>{" "}
						results
					</p>
					<div className="flex gap-2">
						<button
							onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
							disabled={currentPage === 1}
							className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-30 transition-all"
						>
							<ChevronLeft size={20} />
						</button>
						<button
							onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
							disabled={currentPage === totalPages || totalPages === 0}
							className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-30 transition-all"
						>
							<ChevronRight size={20} />
						</button>
					</div>
				</div>
			</div>

			{/* --- Main Modal (Add/Edit) --- */}
			{isModalOpen && (
				<div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
					<div
						className="absolute inset-0 bg-black/40 backdrop-blur-sm"
						onClick={() => !isSubmitting && setIsModalOpen(false)}
					/>
					<div className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl p-8 animate-in fade-in zoom-in duration-200">
						<div className="flex justify-between items-center mb-8">
							<h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">
								{editingItem ? "Edit" : "Add"}{" "}
								{activeTab === "GROUP" ? "Option Group" : "Option Choice"}
							</h2>
							<button
								onClick={() => setIsModalOpen(false)}
								className="p-1 hover:bg-gray-100 rounded-full transition-colors"
							>
								<X size={24} className="text-gray-400" />
							</button>
						</div>

						<form onSubmit={handleSubmit} className="space-y-6">
							<div className="space-y-2">
								<label className="text-xs font-black text-gray-400 uppercase ml-1">
									Name
								</label>
								<input
									type="text"
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder="e.g. Extra Cheese"
									className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all font-medium text-gray-700"
									required
								/>
							</div>

							{activeTab === "GROUP" ? (
								<div className="space-y-2">
									<label className="text-xs font-black text-gray-400 uppercase ml-1">
										Is Required?
									</label>
									<select
										value={isRequired}
										onChange={(e) => setIsRequired(e.target.value)}
										className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-medium appearance-none cursor-pointer"
									>
										<option value="true">True</option>
										<option value="false">False</option>
									</select>
								</div>
							) : (
								<div className="space-y-2">
									<label className="text-xs font-black text-gray-400 uppercase ml-1">
										Belongs to Group
									</label>
									<select
										value={selectedGroupId}
										onChange={(e) => setSelectedGroupId(e.target.value)}
										className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-medium cursor-pointer"
									>
										{groups.map((g) => (
											<option key={g.id} value={g.id}>
												{g.name}
											</option>
										))}
									</select>
								</div>
							)}

							<div className="space-y-2">
								<label className="text-xs font-black text-gray-400 uppercase ml-1">
									Disable Status
								</label>
								<select
									value={disable}
									onChange={(e) => setDisable(e.target.value)}
									className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-medium cursor-pointer"
								>
									<option value="false">False</option>
									<option value="true">True</option>
								</select>
							</div>

							<div className="flex gap-4 pt-4">
								<button
									type="button"
									onClick={() => setIsModalOpen(false)}
									disabled={isSubmitting}
									className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold hover:bg-gray-200 transition-all active:scale-95"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={isSubmitting}
									className="flex-1 py-4 bg-[#4E89C4] text-white rounded-2xl font-bold flex justify-center shadow-lg shadow-blue-100 active:scale-95"
								>
									{isSubmitting ? (
										<Loader2 className="animate-spin" />
									) : (
										"Save Changes"
									)}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* --- Delete Confirmation Modal --- */}
			{isDeleteModalOpen && (
				<div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
					<div
						className="absolute inset-0 bg-black/40 backdrop-blur-sm"
						onClick={() => !isSubmitting && setIsDeleteModalOpen(false)}
					/>
					<div className="relative bg-white rounded-3xl w-full max-w-sm p-8 text-center shadow-2xl animate-in fade-in zoom-in duration-200">
						<div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
							<AlertCircle size={32} />
						</div>
						<h2 className="text-xl font-bold text-gray-800 mb-2">
							Confirm Delete?
						</h2>
						<p className="text-gray-500 text-sm mb-8 leading-relaxed">
							Are you sure you want to delete{" "}
							<span className="font-bold text-gray-800">
								"{deletingItem?.name}"
							</span>
							? This action cannot be undone.
						</p>
						<div className="flex gap-3">
							<button
								onClick={() => setIsDeleteModalOpen(false)}
								disabled={isSubmitting}
								className="flex-1 py-3 bg-gray-100 rounded-2xl font-bold text-gray-500 hover:bg-gray-200 transition-all"
							>
								Cancel
							</button>
							<button
								onClick={handleDeleteConfirm}
								disabled={isSubmitting}
								className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 shadow-lg shadow-red-100 active:scale-95 transition-all"
							>
								{isSubmitting ? (
									<Loader2 className="animate-spin mx-auto" />
								) : (
									"Yes, Delete"
								)}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
