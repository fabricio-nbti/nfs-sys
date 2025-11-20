
import React, { useState, useRef, useMemo } from 'react';
import { flushSync } from 'react-dom';
import { MOCK_PRODUCTS, MOCK_CATEGORIES, MOCK_BRANDS, MOCK_SUPPLIERS } from '../constants';
import { type Product, type Category, type Brand, type Supplier } from '../types';
import { DataTable } from './shared/DataTable';
import { Plus, Edit, Trash2, UploadCloud, LayoutGrid, Printer, Image as ImageIcon, X, Search, Filter, List, Package, AlertTriangle, DollarSign, Tag } from 'lucide-react';
import Modal from './shared/Modal';

const formatCurrency = (value: number | null | undefined): string => {
  const numberValue = Number(value);
  if (value === null || typeof value === 'undefined' || isNaN(numberValue)) {
    return '';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numberValue);
};

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);
  const [brands, setBrands] = useState<Brand[]>(MOCK_BRANDS);
  const [suppliers, setSuppliers] = useState<Supplier[]>(MOCK_SUPPLIERS);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  
  // Data Manipulation
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newBrandName, setNewBrandName] = useState('');
  const [newSupplierName, setNewSupplierName] = useState('');
  const [selection, setSelection] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [printableContent, setPrintableContent] = useState<React.ReactNode | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // --- DERIVED DATA & STATS ---
  const filteredProducts = useMemo(() => {
      return products.filter(p => {
          const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
          const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
          return matchesSearch && matchesCategory;
      });
  }, [products, searchTerm, categoryFilter]);

  const stats = useMemo(() => {
      const totalValue = products.reduce((acc, p) => acc + (p.price * p.stock), 0);
      const lowStockCount = products.filter(p => p.stock <= 5).length;
      return {
          totalProducts: products.length,
          totalValue,
          lowStockCount,
          categoriesCount: categories.length
      };
  }, [products, categories]);

  const availableColumnsForPrint = [
    { key: 'sku', label: 'SKU' },
    { key: 'name', label: 'Nome' },
    { key: 'description', label: 'Descrição' },
    { key: 'price', label: 'Preço' },
    { key: 'costPrice', label: 'Preço de Custo' },
    { key: 'stock', label: 'Estoque' },
    { key: 'category', label: 'Categoria' },
    { key: 'brand', label: 'Marca' },
    { key: 'supplier', label: 'Fornecedor' },
    { key: 'dimensions', label: 'Dimensões (CxLxA cm)' },
    { key: 'weight', label: 'Peso (kg)' },
    { key: 'ncm', label: 'NCM' },
  ];

  const [selectedPrintColumns, setSelectedPrintColumns] = useState<Record<string, boolean>>({
    sku: true,
    name: true,
    category: true,
    price: true,
    stock: true,
  });

  const columns = [
    {
      header: 'Produto',
      accessor: (item: Product) => (
          <div className="flex items-center gap-3">
              {item.imageUrls && item.imageUrls.length > 0 ? (
                  <img src={item.imageUrls[0]} alt={item.name} className="w-10 h-10 object-cover rounded-lg border border-gray-200"/>
              ) : (
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200 text-gray-400">
                      <ImageIcon size={18} />
                  </div>
              )}
              <div>
                  <p className="font-semibold text-gray-800 text-sm">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.sku}</p>
              </div>
          </div>
      )
    },
    { header: 'Categoria', accessor: (item: Product) => <span className="bg-gray-100 text-gray-600 py-1 px-2 rounded text-xs font-medium">{item.category}</span> },
    { header: 'Preço', accessor: (item: Product) => <span className="font-bold text-gray-700">{formatCurrency(item.price)}</span> },
    { 
        header: 'Estoque', 
        accessor: (item: Product) => (
            <span className={`py-1 px-2 rounded-full text-xs font-bold ${item.stock <= 5 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                {item.stock} {item.unit}
            </span>
        )
    },
  ];
  
  const openProductModal = (product: Product | null) => {
    if (product) {
      setEditingProduct({ ...product });
    } else {
      setEditingProduct({
        id: `prod-${Date.now()}`,
        name: '',
        price: 0,
        stock: 0,
        category: '',
        sku: '',
        unit: 'UN',
        imageUrls: [],
      });
    }
    setIsModalOpen(true);
  };
  
  const handleSaveProduct = () => {
    if (!editingProduct) return;
    
    setProducts(prev => {
        const exists = prev.some(p => p.id === editingProduct.id);
        if (exists) {
            return prev.map(p => p.id === editingProduct.id ? (editingProduct as Product) : p);
        }
        return [editingProduct as Product, ...prev];
    });
    
    setIsModalOpen(false);
    setEditingProduct(null);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const isNumeric = ['stock', 'weight', 'icmsRate', 'pisRate', 'cofinsRate'].includes(name);

    setEditingProduct(prev => (prev ? { ...prev, [name]: isNumeric ? (value === '' ? undefined : parseFloat(value)) : value } : null));
  };

  const handleDimensionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const dimKey = name.split('.')[1] as keyof NonNullable<Product['dimensions']>;
    setEditingProduct(prev => {
        if (!prev) return null;
        const newDimensions = {
            length: prev.dimensions?.length || 0,
            width: prev.dimensions?.width || 0,
            height: prev.dimensions?.height || 0,
            [dimKey]: value === '' ? undefined : parseFloat(value)
        };
        return {
            ...prev,
            dimensions: newDimensions,
        };
    });
  };
  
  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value: rawValue } = e.target;
    const onlyNumbers = rawValue.replace(/[^\d]/g, '');
    const numericValue = onlyNumbers ? parseFloat(onlyNumbers) / 100 : undefined;
    
    setEditingProduct(prev => (prev ? { ...prev, [name]: numericValue } : null));
  };

  const handleImageFileChange = async (files: FileList | null) => {
    if (!files) return;

    const fileToDataUrl = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const newImageUrls = await Promise.all(Array.from(files).map(fileToDataUrl));
    
    setEditingProduct(prev => {
        if (!prev) return null;
        const existingUrls = prev.imageUrls || [];
        return {
            ...prev,
            imageUrls: [...existingUrls, ...newImageUrls]
        };
    });
  };
  
  const handleRemoveImage = (indexToRemove: number) => {
    setEditingProduct(prev => {
        if (!prev || !prev.imageUrls) return prev;
        return {
            ...prev,
            imageUrls: prev.imageUrls.filter((_, index) => index !== indexToRemove)
        };
    });
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Tem certeza que deseja excluir ${selection.length} produto(s)?`)) {
      setProducts(prev => prev.filter(p => !selection.includes(p.id)));
      setSelection([]);
    }
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategoryName.trim() && !categories.some(c => c.name.toLowerCase() === newCategoryName.toLowerCase())) {
        const newCategory: Category = { id: `cat-${Date.now()}`, name: newCategoryName.trim() };
        setCategories(prev => [...prev, newCategory]);
        setNewCategoryName('');
    } else { alert("Categoria já existe ou nome é inválido."); }
  };
  const handleDeleteCategory = (id: string) => {
      if (window.confirm("Tem certeza que deseja excluir esta categoria?")) {
          setCategories(prev => prev.filter(c => c.id !== id));
      }
  };

  const handleAddBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBrandName.trim() && !brands.some(b => b.name.toLowerCase() === newBrandName.toLowerCase())) {
        const newBrand: Brand = { id: `brand-${Date.now()}`, name: newBrandName.trim() };
        setBrands(prev => [...prev, newBrand]);
        setNewBrandName('');
    } else { alert("Marca já existe ou nome é inválido."); }
  };
  const handleDeleteBrand = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta marca?")) {
        setBrands(prev => prev.filter(b => b.id !== id));
    }
  };

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSupplierName.trim() && !suppliers.some(s => s.name.toLowerCase() === newSupplierName.toLowerCase())) {
        const newSupplier: Supplier = { id: `sup-${Date.now()}`, name: newSupplierName.trim() };
        setSuppliers(prev => [...prev, newSupplier]);
        setNewSupplierName('');
    } else { alert("Fornecedor já existe ou nome é inválido."); }
  };
  const handleDeleteSupplier = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este fornecedor?")) {
        setSuppliers(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    // ... logic identical to original file import ...
     const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target?.result as string;
        try {
            const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
            if (lines.length < 2) {
                throw new Error("O arquivo CSV está vazio ou contém apenas o cabeçalho.");
            }
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            const requiredHeaders = ['name', 'price', 'stock', 'category', 'sku'];
            if (!requiredHeaders.every(h => headers.includes(h))) {
                throw new Error(`O cabeçalho do CSV é inválido. É necessário conter no mínimo: ${requiredHeaders.join(', ')}`);
            }
            const existingCategoryNames = new Set(categories.map(c => c.name.toLowerCase()));
            const newCategoriesToCreate: Category[] = [];
            const newProducts: Product[] = lines.slice(1).map((line, index) => {
                const values = line.split(',');
                const productData: any = {};
                headers.forEach((header, i) => {
                    productData[header] = values[i]?.trim();
                });
                const price = parseFloat(productData.price);
                const stock = parseInt(productData.stock, 10);
                if (!productData.name || isNaN(price) || isNaN(stock) || !productData.category || !productData.sku) {
                    console.warn(`Linha ${index + 2} ignorada por dados inválidos: ${line}`);
                    return null;
                }
                const categoryName = productData.category;
                if (categoryName && !existingCategoryNames.has(categoryName.toLowerCase())) {
                    const isAlreadyQueued = newCategoriesToCreate.some(c => c.name.toLowerCase() === categoryName.toLowerCase());
                    if (!isAlreadyQueued) {
                        newCategoriesToCreate.push({ id: `cat-import-${Date.now()}-${index}`, name: categoryName });
                        existingCategoryNames.add(categoryName.toLowerCase());
                    }
                }
                return {
                    id: `prod-${Date.now()}-${index}`,
                    name: productData.name,
                    price,
                    stock,
                    category: productData.category,
                    sku: productData.sku,
                    description: productData.description || undefined,
                    costPrice: productData.costprice ? parseFloat(productData.costprice) : undefined,
                    brand: productData.brand || undefined,
                    supplier: productData.supplier || undefined,
                    ncm: productData.ncm || undefined,
                    cest: productData.cest || undefined,
                    unit: productData.unit || 'UN',
                    weight: productData.weight ? parseFloat(productData.weight) : undefined,
                };
            }).filter((p: any): p is Product => p !== null);

            if (newProducts.length === 0) throw new Error("Nenhum produto válido encontrado no arquivo.");
            
            if (newCategoriesToCreate.length > 0) {
                setCategories(prev => [...prev, ...newCategoriesToCreate]);
                alert(`${newCategoriesToCreate.length} nova(s) categoria(s) foram criadas a partir da importação.`);
            }

            setProducts(prevProducts => {
                const existingSkus = new Set(prevProducts.map(p => p.sku));
                const uniqueNewProducts = newProducts.filter(p => !existingSkus.has(p.sku));
                const skippedCount = newProducts.length - uniqueNewProducts.length;
                if (skippedCount > 0) alert(`${skippedCount} produto(s) foram ignorados por já possuírem SKU cadastrado.`);
                return [...prevProducts, ...uniqueNewProducts];
            });
            alert(`${newProducts.length} produto(s) analisado(s) e importado(s) com sucesso!`);
        } catch (error) {
             if (error instanceof Error) alert(`Erro ao importar arquivo: ${error.message}`);
             else alert('Ocorreu um erro desconhecido ao processar o arquivo.');
        } finally {
          if(event.target) event.target.value = '';
        }
    };
    reader.readAsText(file);
  };
  
  const handleInitiatePrint = () => {
     const activeColumns = availableColumnsForPrint.filter(c => selectedPrintColumns[c.key]);
    const getProductValue = (product: Product, key: string): React.ReactNode => {
      switch (key) {
        case 'price': return formatCurrency(product.price);
        case 'costPrice': return formatCurrency(product.costPrice);
        case 'dimensions':
          const d = product.dimensions;
          return d ? `${d.length || 0}x${d.width || 0}x${d.height || 0}` : '';
        default: return product[key as keyof Product] as React.ReactNode ?? '';
      }
    };

    const tableToPrint = (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4 text-center">Lista de Produtos</h1>
        <table className="min-w-full divide-y divide-gray-300 border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              {activeColumns.map(col => (
                <th key={col.key} scope="col" className="px-4 py-2 text-left text-sm font-semibold text-gray-800 border-b-2 border-gray-300">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map(product => (
              <tr key={product.id}>
                {activeColumns.map(col => (
                  <td key={col.key} className="whitespace-nowrap px-4 py-2 text-sm text-gray-700">
                    {getProductValue(product, col.key)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

    flushSync(() => {
        setPrintableContent(tableToPrint);
    });
    window.print();
    setPrintableContent(null);
    setIsPrintModalOpen(false);
  };

  const handleColumnSelectionChange = (key: string) => {
    setSelectedPrintColumns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      
      {/* KPI Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 no-print">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Total de Produtos</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.totalProducts}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg text-blue-500"><Package size={20}/></div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Valor em Estoque</p>
                  <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.totalValue)}</p>
              </div>
               <div className="p-2 bg-green-50 rounded-lg text-green-500"><DollarSign size={20}/></div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Baixo Estoque</p>
                  <p className="text-2xl font-bold text-red-600">{stats.lowStockCount}</p>
              </div>
               <div className="p-2 bg-red-50 rounded-lg text-red-500"><AlertTriangle size={20}/></div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Categorias</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.categoriesCount}</p>
              </div>
               <div className="p-2 bg-purple-50 rounded-lg text-purple-500"><Tag size={20}/></div>
          </div>
      </div>

      {/* Main Toolbar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-3 rounded-xl shadow-sm border border-gray-100 no-print">
        <div className="flex items-center gap-2 w-full lg:w-auto">
             <div className="relative flex-grow lg:flex-grow-0 lg:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar produto..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
            </div>
            <div className="relative">
                 <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                 <select 
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                 >
                     <option value="all">Todas Categorias</option>
                     {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                 </select>
            </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
           <div className="flex bg-gray-100 rounded-lg p-1 mr-2">
                <button 
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                    title="Lista"
                >
                    <List size={18} />
                </button>
                <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                    title="Grade"
                >
                    <LayoutGrid size={18} />
                </button>
           </div>
           
           <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileImport} />
           <button onClick={handleImportClick} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Importar CSV">
              <UploadCloud size={20} />
           </button>
           
            <button onClick={() => setIsPrintModalOpen(true)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Imprimir">
              <Printer size={20} />
            </button>
            
            <button 
              onClick={() => openProductModal(null)}
              className="bg-primary text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700 transition-colors text-sm font-semibold shadow-sm"
            >
              <Plus size={18} className="mr-1.5" />
              Novo Produto
            </button>
        </div>
      </div>

      {selection.length > 0 && (
           <div className="bg-indigo-50 border border-indigo-100 text-indigo-800 p-3 rounded-xl flex justify-between items-center animate-fade-in no-print">
              <span className="text-sm font-medium ml-2">{selection.length} selecionado(s)</span>
              <button
                onClick={handleBulkDelete}
                className="bg-white border border-red-200 text-red-600 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-50 flex items-center shadow-sm"
              >
                <Trash2 size={14} className="mr-1" />
                Excluir Selecionados
              </button>
            </div>
      )}
      
      <div className="flex justify-end gap-2 mb-4 text-xs text-gray-500 no-print">
          <button onClick={() => setIsCategoryModalOpen(true)} className="hover:text-primary hover:underline">Gerenciar Categorias</button>
          <span>•</span>
          <button onClick={() => setIsBrandModalOpen(true)} className="hover:text-primary hover:underline">Gerenciar Marcas</button>
          <span>•</span>
          <button onClick={() => setIsSupplierModalOpen(true)} className="hover:text-primary hover:underline">Gerenciar Fornecedores</button>
      </div>

      {/* Content Area */}
      <div className="no-print">
        {viewMode === 'list' ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <DataTable<Product>
                columns={columns}
                data={filteredProducts}
                selection={selection}
                onSelectionChange={setSelection}
                renderActions={(item) => (
                    <div className="flex space-x-2">
                        <button onClick={() => openProductModal(item)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar"><Edit size={18} /></button>
                        <button onClick={() => {
                            if (window.confirm("Excluir produto?")) setProducts(p => p.filter(x => x.id !== item.id));
                        }} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Excluir"><Trash2 size={18} /></button>
                    </div>
                )}
                />
            </div>
        ) : (
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                 {filteredProducts.map(product => (
                     <div key={product.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-all group flex flex-col">
                         <div className="relative aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                            {product.imageUrls && product.imageUrls.length > 0 ? (
                                <img src={product.imageUrls[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                            ) : (
                                <ImageIcon className="text-gray-300 w-10 h-10" />
                            )}
                             <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                                 <button onClick={() => openProductModal(product)} className="bg-white text-gray-600 p-1.5 rounded-full shadow-sm hover:text-primary"><Edit size={14}/></button>
                             </div>
                             {product.stock <= 5 && (
                                <span className="absolute bottom-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                    Baixo Estoque
                                </span>
                             )}
                         </div>
                         <div className="p-3 flex flex-col flex-1">
                             <p className="text-xs text-gray-500 mb-0.5">{product.category}</p>
                             <h3 className="font-semibold text-gray-800 text-sm line-clamp-2 mb-1 leading-tight">{product.name}</h3>
                             <div className="mt-auto pt-2 flex justify-between items-end">
                                 <div>
                                     <p className="text-xs text-gray-400">SKU: {product.sku}</p>
                                     <p className="font-bold text-primary text-lg">{formatCurrency(product.price)}</p>
                                 </div>
                                 <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                     {product.stock} un
                                 </span>
                             </div>
                         </div>
                     </div>
                 ))}
             </div>
        )}
      </div>

      {/* --- MODALS (Refactored for cleaner code, logic largely same as before but styled) --- */}
      
       <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProduct?.id ? "Editar Produto" : "Novo Produto"} size="3xl">
        {editingProduct && (
        <form className="max-h-[80vh] overflow-y-auto pr-2 space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-8">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome do Produto</label>
                    <input type="text" name="name" value={editingProduct.name || ''} onChange={handleInputChange} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" required/>
                </div>
                <div className="md:col-span-4">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">SKU / Código</label>
                    <input type="text" name="sku" value={editingProduct.sku || ''} onChange={handleInputChange} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" required/>
                </div>
                <div className="md:col-span-12">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descrição</label>
                    <textarea name="description" value={editingProduct.description || ''} onChange={handleInputChange} rows={3} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none"></textarea>
                </div>
            </div>

            {/* Pricing & Stock */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center"><DollarSign size={16} className="mr-2"/> Preços e Estoque</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Preço de Custo (R$)</label>
                        <input type="text" name="costPrice" value={formatCurrency(editingProduct.costPrice)} onChange={handleCurrencyChange} className="w-full p-2 border rounded-lg"/>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Preço de Venda (R$)</label>
                        <input type="text" name="price" value={formatCurrency(editingProduct.price)} onChange={handleCurrencyChange} className="w-full p-2 border rounded-lg font-bold text-gray-800"/>
                    </div>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-1">Estoque</label>
                            <input type="number" name="stock" value={editingProduct.stock || 0} onChange={handleInputChange} className="w-full p-2 border rounded-lg"/>
                        </div>
                         <div className="w-24">
                            <label className="block text-xs text-gray-500 mb-1">Unidade</label>
                            <select name="unit" value={editingProduct.unit || 'UN'} onChange={handleInputChange} className="w-full p-2 border rounded-lg bg-white">
                                <option>UN</option><option>KG</option><option>PC</option><option>CX</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Categories & Relations */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Categoria</label>
                    <select name="category" value={editingProduct.category || ''} onChange={handleInputChange} className="w-full p-2 border rounded-lg bg-white">
                        <option value="">Selecione...</option>
                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Marca</label>
                    <select name="brand" value={editingProduct.brand || ''} onChange={handleInputChange} className="w-full p-2 border rounded-lg bg-white">
                         <option value="">Selecione...</option>
                         {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fornecedor</label>
                    <select name="supplier" value={editingProduct.supplier || ''} onChange={handleInputChange} className="w-full p-2 border rounded-lg bg-white">
                        <option value="">Selecione...</option>
                         {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Images */}
            <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Imagens</label>
                 <div className="grid grid-cols-4 gap-3">
                     {editingProduct.imageUrls?.map((url, index) => (
                        <div key={index} className="relative aspect-square border rounded-lg overflow-hidden group">
                            <img src={url} alt="" className="w-full h-full object-cover"/>
                             <button type="button" onClick={() => handleRemoveImage(index)} className="absolute top-1 right-1 bg-red-500 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button>
                        </div>
                     ))}
                     <label className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-gray-400 hover:text-primary hover:border-primary cursor-pointer transition-colors">
                         <UploadCloud size={24}/>
                         <span className="text-[10px] mt-1">Adicionar</span>
                         <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleImageFileChange(e.target.files)}/>
                     </label>
                 </div>
            </div>
             
             {/* Fiscal & Dimensions (Collapsed logic or separate tab usually, keeping simplified here) */}
            <div className="border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-1">
                        <label className="block text-xs text-gray-500 mb-1">NCM</label>
                         <input type="text" name="ncm" value={editingProduct.ncm || ''} onChange={handleInputChange} className="w-full p-2 border rounded-lg"/>
                    </div>
                     <div className="md:col-span-3 grid grid-cols-3 gap-2">
                         <div>
                            <label className="block text-xs text-gray-500 mb-1">Comp. (cm)</label>
                            <input type="number" name="dimensions.length" value={editingProduct.dimensions?.length || ''} onChange={handleDimensionChange} className="w-full p-2 border rounded-lg"/>
                         </div>
                         <div>
                            <label className="block text-xs text-gray-500 mb-1">Larg. (cm)</label>
                            <input type="number" name="dimensions.width" value={editingProduct.dimensions?.width || ''} onChange={handleDimensionChange} className="w-full p-2 border rounded-lg"/>
                         </div>
                         <div>
                            <label className="block text-xs text-gray-500 mb-1">Alt. (cm)</label>
                            <input type="number" name="dimensions.height" value={editingProduct.dimensions?.height || ''} onChange={handleDimensionChange} className="w-full p-2 border rounded-lg"/>
                         </div>
                     </div>
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Cancelar</button>
                 <button type="button" onClick={handleSaveProduct} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700 font-medium">Salvar Produto</button>
            </div>
        </form>
        )}
      </Modal>
      
      {/* Other small modals (Category, Brand, etc.) can be rendered here similar to previous implementation */}
       <Modal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} title="Categorias">
           <div className="space-y-4">
                <form onSubmit={handleAddCategory} className="flex gap-2">
                  <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Nova Categoria" className="flex-1 p-2 border rounded-lg"/>
                  <button type="submit" className="bg-primary text-white px-4 rounded-lg">Add</button>
              </form>
               <ul className="max-h-60 overflow-y-auto space-y-1">
                  {categories.map(c => (
                      <li key={c.id} className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm">
                          {c.name}
                          <button onClick={() => handleDeleteCategory(c.id)} className="text-red-500"><Trash2 size={14}/></button>
                      </li>
                  ))}
              </ul>
           </div>
       </Modal>
       <Modal isOpen={isBrandModalOpen} onClose={() => setIsBrandModalOpen(false)} title="Marcas">
           <div className="space-y-4">
                <form onSubmit={handleAddBrand} className="flex gap-2">
                  <input type="text" value={newBrandName} onChange={(e) => setNewBrandName(e.target.value)} placeholder="Nova Marca" className="flex-1 p-2 border rounded-lg"/>
                  <button type="submit" className="bg-primary text-white px-4 rounded-lg">Add</button>
              </form>
               <ul className="max-h-60 overflow-y-auto space-y-1">
                  {brands.map(b => (
                      <li key={b.id} className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm">
                          {b.name}
                          <button onClick={() => handleDeleteBrand(b.id)} className="text-red-500"><Trash2 size={14}/></button>
                      </li>
                  ))}
              </ul>
           </div>
       </Modal>
        <Modal isOpen={isSupplierModalOpen} onClose={() => setIsSupplierModalOpen(false)} title="Fornecedores">
           <div className="space-y-4">
                <form onSubmit={handleAddSupplier} className="flex gap-2">
                  <input type="text" value={newSupplierName} onChange={(e) => setNewSupplierName(e.target.value)} placeholder="Novo Fornecedor" className="flex-1 p-2 border rounded-lg"/>
                  <button type="submit" className="bg-primary text-white px-4 rounded-lg">Add</button>
              </form>
               <ul className="max-h-60 overflow-y-auto space-y-1">
                  {suppliers.map(s => (
                      <li key={s.id} className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm">
                          {s.name}
                          <button onClick={() => handleDeleteSupplier(s.id)} className="text-red-500"><Trash2 size={14}/></button>
                      </li>
                  ))}
              </ul>
           </div>
       </Modal>

      <Modal isOpen={isPrintModalOpen} onClose={() => setIsPrintModalOpen(false)} title="Imprimir Lista">
        <div className="space-y-2">
          <p className="text-sm text-gray-600 mb-4">Selecione as colunas:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {availableColumnsForPrint.map(col => (
              <label key={col.key} className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={!!selectedPrintColumns[col.key]} onChange={() => handleColumnSelectionChange(col.key)} className="rounded border-gray-300 text-primary focus:ring-primary"/>
                <span>{col.label}</span>
              </label>
            ))}
          </div>
           <div className="flex justify-end mt-6">
               <button onClick={handleInitiatePrint} className="bg-primary text-white px-6 py-2 rounded-lg font-medium">Imprimir</button>
           </div>
        </div>
      </Modal>

      <div id="products-dynamic-print-area">
        {printableContent}
      </div>
    </div>
  );
};

export default Products;
