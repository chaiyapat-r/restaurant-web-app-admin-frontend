"use client";
import { useEffect, useState, useRef } from "react";
import {
	Plus,
	ChevronLeft,
	ChevronRight,
	X,
	Loader2,
	Edit2,
	Trash2,
	AlertCircle,
	ImageIcon
} from "lucide-react";

interface OptionGroup {
	id: number;
	name: string;
}

interface Menu {
	id: number;
	name: string;
	price: number;
	imageUrl: string;
	category: { name: string };
	categoryId: number;
	disable: boolean;
	optionGroups: { optionGroupId: number; optionGroup: OptionGroup }[] | any[];
}

export default function MenusPage() {
	const [menus, setMenus] = useState<Menu[]>([]);
	const [categories, setCategories] = useState<{ id: number; name: string }[]>(
		[]
	);
	const [allOptionGroups, setAllOptionGroups] = useState<OptionGroup[]>([]);
	const [loading, setLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// --- Modal & Form States ---
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [menuToDelete, setMenuToDelete] = useState<Menu | null>(null);
	const [editingMenu, setEditingMenu] = useState<Menu | null>(null);

	const [name, setName] = useState("");
	const [price, setPrice] = useState("");
	const [categoryId, setCategoryId] = useState("");
	const [disable, setDisable] = useState("false");
	const [selectedOptions, setSelectedOptions] = useState<number[]>([]);

	// --- Image States ---
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [isImageDeleted, setIsImageDeleted] = useState(false);

	// --- Pagination States ---
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 8;

	useEffect(() => {
		fetchData();
	}, []);

	const fetchData = async () => {
		setLoading(true);
		try {
			const apiUrl = process.env.NEXT_PUBLIC_API_URL;
			const headers = {
				Authorization: `Bearer ${localStorage.getItem("access_token")}`
			};

			const [menuRes, catRes, optRes] = await Promise.all([
				fetch(`${apiUrl}/menus`, { headers }),
				fetch(`${apiUrl}/categories`, { headers }),
				fetch(`${apiUrl}/option-groups`, { headers })
			]);

			const [menuData, catData, optData] = await Promise.all([
				menuRes.json(),
				catRes.json(),
				optRes.json()
			]);

			setMenus(Array.isArray(menuData) ? menuData : []);
			setCategories(Array.isArray(catData) ? catData : []);
			setAllOptionGroups(Array.isArray(optData) ? optData : []);
		} catch (error) {
			console.error("Fetch error:", error);
		} finally {
			setLoading(false);
		}
	};

	// --- 1. Logic แก้ไขรายการ (Edit) ---
	const handleEditClick = (menu: Menu) => {
		setEditingMenu(menu);
		setName(menu.name);
		setPrice(menu.price.toString());
		setCategoryId(menu.categoryId.toString());
		setDisable(menu.disable.toString());

		// ดึง ID ของ Option Groups เดิมออกมา
		const existingOptionIds =
			menu.optionGroups?.map((og: any) => og.optionGroupId || og.id) || [];
		setSelectedOptions(existingOptionIds.length > 0 ? existingOptionIds : [0]);

		setPreviewUrl(menu.imageUrl);
		setSelectedFile(null);
		setIsImageDeleted(false); // Reset สถานะทุกครั้งที่เปิด Modal ใหม่
		setIsModalOpen(true);
	};

	// --- 2. Logic ลบรายการ (Delete) ---
	const handleDeleteClick = (menu: Menu) => {
		setMenuToDelete(menu);
		setIsDeleteModalOpen(true);
	};

	const confirmDelete = async () => {
		if (!menuToDelete) return;
		setIsSubmitting(true);
		try {
			const apiUrl = process.env.NEXT_PUBLIC_API_URL;
			const response = await fetch(`${apiUrl}/menus/${menuToDelete.id}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${localStorage.getItem("access_token")}`
				}
			});
			if (response.ok) {
				fetchData();
				setIsDeleteModalOpen(false);
			}
		} catch (error) {
			alert("Error deleting menu");
		} finally {
			setIsSubmitting(false);
		}
	};

	// --- Image Logic ---
	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setSelectedFile(file);
			setPreviewUrl(URL.createObjectURL(file));
		}
	};

	const removeImage = (e: React.MouseEvent) => {
		e.stopPropagation();
		setSelectedFile(null);
		setPreviewUrl(null);
		setIsImageDeleted(true); // <--- มาร์คไว้ว่ารูปถูกลบออกแล้ว
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	// --- Dynamic Option Logic ---
	const addOptionField = () => setSelectedOptions([...selectedOptions, 0]);
	const removeOptionField = (indexToRemove: number) => {
		const filtered = selectedOptions.filter(
			(_, index) => index !== indexToRemove
		);
		setSelectedOptions(filtered.length > 0 ? filtered : [0]);
	};
	const updateOptionValue = (index: number, value: string) => {
		const newOptions = [...selectedOptions];
		newOptions[index] = Number(value);
		setSelectedOptions(newOptions);
	};

	// --- CRUD Logic (Submit) ---
	const handleAddClick = () => {
		setEditingMenu(null);
		setName("");
		setPrice("");
		setCategoryId(categories[0]?.id.toString() || "");
		setDisable("false");
		setSelectedOptions([0]);
		setPreviewUrl(null);
		setSelectedFile(null);
		setIsModalOpen(true);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		const formData = new FormData();
		formData.append("name", name);
		formData.append("price", price);
		formData.append("categoryId", categoryId);
		formData.append("disable", disable);
		formData.append(
			"optionGroupIds",
			JSON.stringify(selectedOptions.filter((id) => id !== 0))
		);

		// --- Logic เรื่องรูปภาพ ---
		if (selectedFile) {
			// กรณีมีไฟล์ใหม่
			formData.append("file", selectedFile);
		} else if (isImageDeleted) {
			// กรณีไม่มีไฟล์ใหม่ และกดลบรูปเดิมออก
			formData.append("imageUrl", "");
		}

		try {
			const apiUrl = process.env.NEXT_PUBLIC_API_URL;
			const method = editingMenu ? "PATCH" : "POST";
			const url = editingMenu
				? `${apiUrl}/menus/${editingMenu.id}`
				: `${apiUrl}/menus`;

			const response = await fetch(url, {
				method,
				headers: {
					Authorization: `Bearer ${localStorage.getItem("access_token")}`
				},
				body: formData
			});

			if (response.ok) {
				setIsModalOpen(false);
				setIsImageDeleted(false); // Reset
				fetchData();
			}
		} catch (error) {
			alert("Error saving menu");
		} finally {
			setIsSubmitting(false);
		}
	};

	// --- Pagination Calculation ---
	const indexOfLastItem = currentPage * itemsPerPage;
	const indexOfFirstItem = indexOfLastItem - itemsPerPage;
	const currentItems = menus.slice(indexOfFirstItem, indexOfLastItem);
	const totalPages = Math.ceil(menus.length / itemsPerPage);

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-2xl font-bold text-gray-800">Menus</h1>
					<p className="text-sm text-gray-500 mt-1">
						Manage your restaurant menu items
					</p>
				</div>
				<button
					onClick={handleAddClick}
					className="bg-[#4E89C4] hover:bg-[#3d6fa1] text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-100 transition-all active:scale-95"
				>
					<Plus size={20} /> Add Menu
				</button>
			</div>

			{/* Table Section */}
			<div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
				<table className="w-full text-left">
					<thead className="bg-gray-50 border-b border-gray-100">
						<tr>
							<th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
								Img
							</th>
							<th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
								Name
							</th>
							<th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
								Category
							</th>
							<th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
								Price
							</th>
							<th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
								Status
							</th>
							<th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">
								Actions
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-gray-50">
						{loading ? (
							<tr>
								<td colSpan={6} className="py-20 text-center">
									<Loader2
										className="animate-spin mx-auto text-gray-300"
										size={40}
									/>
								</td>
							</tr>
						) : (
							currentItems.map((menu) => (
								<tr
									key={menu.id}
									className="hover:bg-gray-50/50 transition-colors"
								>
									<td className="px-6 py-4">
										<div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 border border-gray-50">
											{menu.imageUrl ? (
												<img
													src={menu.imageUrl}
													alt={menu.name}
													className="w-full h-full object-cover"
												/>
											) : (
												<ImageIcon className="w-full h-full p-3 text-gray-200" />
											)}
										</div>
									</td>
									<td className="px-6 py-4 font-bold text-gray-700">
										{menu.name}
									</td>
									<td className="px-6 py-4 text-gray-500">
										{menu.category?.name || "N/A"}
									</td>
									<td className="px-6 py-4 font-bold text-[#4E89C4]">
										฿{menu.price.toFixed(2)}
									</td>
									<td className="px-6 py-4">
										<span
											className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${menu.disable ? "bg-red-50 text-red-500 border border-red-100" : "bg-green-50 text-green-600 border border-green-100"}`}
										>
											{menu.disable ? "Disabled" : "Active"}
										</span>
									</td>
									<td className="px-6 py-4 text-right">
										<div className="flex justify-end gap-1">
											<button
												onClick={() => handleEditClick(menu)}
												className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
											>
												<Edit2 size={18} />
											</button>
											<button
												onClick={() => handleDeleteClick(menu)}
												className="p-2 text-gray-400 hover:text-red-500 transition-colors"
											>
												<Trash2 size={18} />
											</button>
										</div>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>

				{/* Pagination Section */}
				<div className="px-8 py-5 bg-white border-t border-gray-50 flex items-center justify-between">
					<p className="text-sm text-gray-500 font-medium">
						Showing{" "}
						<span className="text-gray-900">
							{menus.length > 0 ? indexOfFirstItem + 1 : 0}
						</span>{" "}
						to{" "}
						<span className="text-gray-900">
							{Math.min(indexOfLastItem, menus.length)}
						</span>{" "}
						of <span className="text-gray-900">{menus.length}</span> items
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

			{/* --- 1. Menu Information Modal (Add/Edit) --- */}
			{isModalOpen && (
				<div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
					<div
						className="absolute inset-0 bg-black/40 backdrop-blur-sm"
						onClick={() => !isSubmitting && setIsModalOpen(false)}
					/>
					<div className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl p-8 max-h-[90vh] overflow-y-auto animate-in zoom-in duration-200">
						<div className="flex justify-between items-center mb-6">
							<h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">
								{editingMenu ? "Edit Menu" : "Menu Information"}
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
									Menu Image
								</label>
								<div
									onClick={() => fileInputRef.current?.click()}
									className="w-36 h-36 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-all overflow-hidden relative group"
								>
									{previewUrl ? (
										<>
											<img
												src={previewUrl}
												className="w-full h-full object-cover"
												alt="Preview"
											/>
											<button
												type="button"
												onClick={removeImage}
												className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
											>
												<X size={16} />
											</button>
										</>
									) : (
										<>
											<ImageIcon size={28} className="text-gray-300 mb-1" />
											<span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
												Add Image
											</span>
										</>
									)}
								</div>
								<input
									type="file"
									ref={fileInputRef}
									onChange={handleFileChange}
									className="hidden"
									accept="image/*"
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<label className="text-xs font-black text-gray-400 uppercase ml-1">
										Menu Name
									</label>
									<input
										type="text"
										value={name}
										onChange={(e) => setName(e.target.value)}
										className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all font-medium"
										required
									/>
								</div>
								<div className="space-y-2">
									<label className="text-xs font-black text-gray-400 uppercase ml-1">
										Price (฿)
									</label>
									<input
										type="number"
										value={price}
										onChange={(e) => setPrice(e.target.value)}
										className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all font-medium"
										required
									/>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<label className="text-xs font-black text-gray-400 uppercase ml-1">
										Category
									</label>
									<select
										value={categoryId}
										onChange={(e) => setCategoryId(e.target.value)}
										className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none cursor-pointer font-medium appearance-none"
									>
										{categories.map((cat) => (
											<option key={cat.id} value={cat.id}>
												{cat.name}
											</option>
										))}
									</select>
								</div>
								<div className="space-y-2">
									<label className="text-xs font-black text-gray-400 uppercase ml-1">
										Status
									</label>
									<select
										value={disable}
										onChange={(e) => setDisable(e.target.value)}
										className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none cursor-pointer font-medium appearance-none"
									>
										<option value="false">Active</option>
										<option value="true">Disabled</option>
									</select>
								</div>
							</div>

							<div className="space-y-3">
								<label className="text-xs font-black text-gray-400 uppercase ml-1">
									Option Groups
								</label>
								{selectedOptions.map((optId, index) => (
									<div
										key={index}
										className="flex gap-3 items-end animate-in fade-in slide-in-from-left-2 duration-200"
									>
										<div className="flex-1 space-y-1">
											<select
												value={optId}
												onChange={(e) =>
													updateOptionValue(index, e.target.value)
												}
												className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none cursor-pointer font-medium"
											>
												<option value={0}>Select Group</option>
												{allOptionGroups.map((g) => (
													<option key={g.id} value={g.id}>
														{g.name}
													</option>
												))}
											</select>
										</div>
										<button
											type="button"
											onClick={() => removeOptionField(index)}
											className="p-4 bg-red-50 text-red-400 rounded-2xl hover:bg-red-100 transition-colors"
										>
											<Trash2 size={20} />
										</button>
									</div>
								))}
								<button
									type="button"
									onClick={addOptionField}
									className="w-full py-4 border-2 border-dashed border-gray-100 rounded-2xl text-gray-300 text-xs font-black hover:bg-gray-50 transition-all uppercase flex items-center justify-center gap-2"
								>
									<Plus size={16} /> Add Option Group
								</button>
							</div>

							<div className="flex gap-4 pt-4">
								<button
									type="button"
									onClick={() => setIsModalOpen(false)}
									className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black hover:bg-gray-200 transition-all"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={isSubmitting}
									className="flex-1 py-4 bg-[#4E89C4] text-white rounded-2xl font-black shadow-lg shadow-blue-100 active:scale-95 transition-all"
								>
									{isSubmitting ? (
										<Loader2 className="animate-spin mx-auto" size={20} />
									) : (
										"Save Changes"
									)}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* --- 2. Delete Confirmation Modal --- */}
			{isDeleteModalOpen && (
				<div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
					<div
						className="absolute inset-0 bg-black/40 backdrop-blur-sm"
						onClick={() => !isSubmitting && setIsDeleteModalOpen(false)}
					/>
					<div className="relative bg-white rounded-3xl w-full max-w-sm shadow-2xl p-8 text-center animate-in zoom-in duration-200">
						<div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
							<AlertCircle size={40} className="text-red-500" />
						</div>
						<h3 className="text-xl font-black text-gray-800 mb-2">
							Are you sure?
						</h3>
						<p className="text-gray-500 text-sm mb-8">
							Do you really want to delete{" "}
							<span className="font-bold text-gray-700">
								"{menuToDelete?.name}"
							</span>
							? This action cannot be undone.
						</p>
						<div className="flex gap-3">
							<button
								onClick={() => setIsDeleteModalOpen(false)}
								className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-xl font-bold hover:bg-gray-200 transition-all"
							>
								Cancel
							</button>
							<button
								onClick={confirmDelete}
								disabled={isSubmitting}
								className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold shadow-lg shadow-red-100 active:scale-95 transition-all flex items-center justify-center"
							>
								{isSubmitting ? (
									<Loader2 className="animate-spin" size={20} />
								) : (
									"Delete"
								)}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
