

import React, { useState, useRef } from 'react';
import { flushSync } from 'react-dom';
import { MOCK_PRODUCTS, MOCK_CATEGORIES, MOCK_BRANDS, MOCK_SUPPLIERS } from '../constants';
import { type Product, type Category, type Brand, type Supplier } from '../types';
import { DataTable } from './shared/DataTable';
import { Plus, Edit, Trash2, UploadCloud, LayoutGrid, Printer, Image as ImageIcon, X } from 'lucide-react';
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newBrandName, setNewBrandName] = useState('');
  const [newSupplierName, setNewSupplierName] = useState('');
  const [selection, setSelection] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [printableContent, setPrintableContent] = useState<React.ReactNode | null>(null);

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
      header: 'Imagem',
      accessor: (item: Product) => (
          item.imageUrls && item.imageUrls.length > 0 ? (
              <img src={item.imageUrls[0]} alt={item.name} className="w-12 h-12 object-cover rounded-md"/>
          ) : (
              <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center">
                  <ImageIcon className="text-gray-400" />
              </div>
          )
      )
    },
    { header: 'SKU', accessor: 'sku' as keyof Product },
    { header: 'Nome', accessor: 'name' as keyof Product },
    { header: 'Categoria', accessor: 'category' as keyof Product },
    { header: 'Preço', accessor: (item: Product) => formatCurrency(item.price) },
    { header: 'Estoque', accessor: 'stock' as keyof Product },
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
    const isNumeric = ['stock', 'weight'].includes(name);

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

            if (newProducts.length === 0) {
                throw new Error("Nenhum produto válido encontrado no arquivo.");
            }
            
            if (newCategoriesToCreate.length > 0) {
                setCategories(prev => [...prev, ...newCategoriesToCreate]);
                alert(`${newCategoriesToCreate.length} nova(s) categoria(s) foram criadas a partir da importação.`);
            }

            setProducts(prevProducts => {
                const existingSkus = new Set(prevProducts.map(p => p.sku));
                const uniqueNewProducts = newProducts.filter(p => !existingSkus.has(p.sku));
                
                const skippedCount = newProducts.length - uniqueNewProducts.length;
                if (skippedCount > 0) {
                    alert(`${skippedCount} produto(s) foram ignorados por já possuírem SKU cadastrado.`);
                }

                return [...prevProducts, ...uniqueNewProducts];
            });

            alert(`${newProducts.length} produto(s) analisado(s) e importado(s) com sucesso!`);

        } catch (error) {
            if (error instanceof Error) {
              alert(`Erro ao importar arquivo: ${error.message}`);
            } else {
              alert('Ocorreu um erro desconhecido ao processar o arquivo.');
            }
        } finally {
          if(event.target) {
            event.target.value = '';
          }
        }
    };
    reader.readAsText(file);
  };
  
  const handleInitiatePrint = () => {
    const activeColumns = availableColumnsForPrint.filter(c => selectedPrintColumns[c.key]);

    const getProductValue = (product: Product, key: string): React.ReactNode => {
      switch (key) {
        case 'price':
        case 'costPrice':
          return formatCurrency(product[key as 'price' | 'costPrice']);
        case 'dimensions':
          const d = product.dimensions;
          return d ? `${d.length || 0}x${d.width || 0}x${d.height || 0}` : '';
        default:
          return product[key as keyof Product] as React.ReactNode ?? '';
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
    <div>
      <div className="flex justify-between items-center mb-6 no-print">
        <h1 className="text-3xl font-bold text-gray-800">Produtos</h1>
        <div className="flex items-center gap-2">
           <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".csv"
              onChange={handleFileImport}
            />
            <button
              onClick={handleImportClick}
              className="bg-secondary text-white px-4 py-2 rounded-lg flex items-center hover:bg-emerald-600 transition-colors"
            >
              <UploadCloud size={20} className="mr-2" />
              Importar
            </button>
            <button
                onClick={() => setIsCategoryModalOpen(true)}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-gray-700 transition-colors"
            >
                <LayoutGrid size={20} className="mr-2" />
                Categorias
            </button>
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-600 transition-colors"
            >
              <Printer size={20} className="mr-2" />
              Imprimir Tabela
            </button>
            <button 
              onClick={() => openProductModal(null)}
              className="bg-primary text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700 transition-colors">
              <Plus size={20} className="mr-2" />
              Novo Produto
            </button>
        </div>
      </div>

      <div className="no-print">
        {selection.length > 0 && (
           <div className="bg-indigo-100 border-l-4 border-indigo-500 text-indigo-700 p-4 mb-4 rounded-r-lg flex justify-between items-center">
              <span>{selection.length} selecionado(s)</span>
              <div>
                <button
                  onClick={handleBulkDelete}
                  className="bg-red-500 text-white px-3 py-1 rounded-md text-sm font-semibold hover:bg-red-600 flex items-center"
                >
                  <Trash2 size={16} className="mr-1" />
                  Excluir Selecionados
                </button>
              </div>
            </div>
        )}
      </div>

      <div className="no-print">
        <DataTable<Product>
          columns={columns}
          data={products}
          selection={selection}
          onSelectionChange={setSelection}
          renderActions={(item) => (
            <div className="flex space-x-2 no-print">
              <button onClick={() => openProductModal(item)} className="text-yellow-600 hover:text-yellow-900"><Edit size={18} /></button>
              <button className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
            </div>
          )}
        />
      </div>

       <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProduct?.id ? "Editar Produto" : "Adicionar Novo Produto"} size="3xl">
        {editingProduct && (
        <form className="max-h-[80vh] overflow-y-auto pr-2 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome do Produto</label>
                    <input type="text" id="name" name="name" value={editingProduct.name || ''} onChange={handleInputChange} className="mt-1 p-2 border rounded w-full"/>
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descrição</label>
                    <textarea id="description" name="description" value={editingProduct.description || ''} onChange={handleInputChange} rows={3} className="mt-1 p-2 border rounded w-full"></textarea>
                </div>
                <div>
                    <label htmlFor="sku" className="block text-sm font-medium text-gray-700">SKU</label>
                    <input type="text" id="sku" name="sku" value={editingProduct.sku || ''} onChange={handleInputChange} className="mt-1 p-2 border rounded w-full"/>
                </div>
                <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">Categoria</label>
                    <div className="flex items-center gap-2 mt-1">
                        <select id="category" name="category" value={editingProduct.category || ''} onChange={handleInputChange} className="p-2 border rounded bg-white flex-grow">
                            <option value="">Selecione uma categoria</option>
                            {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                        </select>
                        <button type="button" onClick={() => setIsCategoryModalOpen(true)} className="bg-gray-200 text-gray-700 px-3 py-2 text-xs rounded-lg hover:bg-gray-300 flex-shrink-0">Gerenciar</button>
                    </div>
                </div>
            </div>

            <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-600 mb-2">Valores e Estoque</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="costPrice" className="block text-sm font-medium text-gray-700">Preço de Custo</label>
                        <input type="text" id="costPrice" name="costPrice" value={formatCurrency(editingProduct.costPrice)} onChange={handleCurrencyChange} className="mt-1 p-2 border rounded w-full"/>
                    </div>
                    <div>
                        <label htmlFor="price" className="block text-sm font-medium text-gray-700">Preço de Venda</label>
                        <input type="text" id="price" name="price" value={formatCurrency(editingProduct.price)} onChange={handleCurrencyChange} className="mt-1 p-2 border rounded w-full"/>
                    </div>
                    <div>
                        <label htmlFor="stock" className="block text-sm font-medium text-gray-700">Estoque Atual</label>
                        <input type="number" id="stock" name="stock" value={editingProduct.stock || 0} onChange={handleInputChange} className="mt-1 p-2 border rounded w-full"/>
                    </div>
                </div>
            </div>
            
            <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-600 mb-2">Imagens do Produto</h3>
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {editingProduct.imageUrls?.map((url, index) => (
                        <div key={index} className="relative aspect-square border rounded-md overflow-hidden group">
                            <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover"/>
                            <button 
                                type="button" 
                                onClick={() => handleRemoveImage(index)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                    <label 
                        htmlFor="product-image-upload" 
                        onDrop={(e) => { e.preventDefault(); handleImageFileChange(e.dataTransfer.files); }}
                        onDragOver={(e) => e.preventDefault()}
                        className="aspect-square border-2 border-dashed rounded-md flex flex-col items-center justify-center text-gray-400 hover:text-primary hover:border-primary cursor-pointer transition-colors"
                    >
                        <UploadCloud size={32}/>
                        <span className="text-xs mt-1 text-center">Adicionar Imagem</span>
                    </label>
                    <input id="product-image-upload" type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleImageFileChange(e.target.files)}/>
                </div>
            </div>

            <div className="border-t pt-4">
                 <h3 className="font-semibold text-gray-600 mb-2">Detalhes Adicionais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="brand" className="block text-sm font-medium text-gray-700">Marca</label>
                        <div className="flex items-center gap-2 mt-1">
                             <select id="brand" name="brand" value={editingProduct.brand || ''} onChange={handleInputChange} className="p-2 border rounded bg-white flex-grow">
                                <option value="">Selecione uma marca</option>
                                {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                            </select>
                            <button type="button" onClick={() => setIsBrandModalOpen(true)} className="bg-gray-200 text-gray-700 px-3 py-2 text-xs rounded-lg hover:bg-gray-300 flex-shrink-0">Gerenciar</button>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="supplier" className="block text-sm font-medium text-gray-700">Fornecedor</label>
                        <div className="flex items-center gap-2 mt-1">
                            <select id="supplier" name="supplier" value={editingProduct.supplier || ''} onChange={handleInputChange} className="p-2 border rounded bg-white flex-grow">
                                <option value="">Selecione um fornecedor</option>
                                {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                            </select>
                            <button type="button" onClick={() => setIsSupplierModalOpen(true)} className="bg-gray-200 text-gray-700 px-3 py-2 text-xs rounded-lg hover:bg-gray-300 flex-shrink-0">Gerenciar</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-600 mb-2">Logística</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label htmlFor="unit" className="block text-sm font-medium text-gray-700">Unidade</label>
                        <select id="unit" name="unit" value={editingProduct.unit || 'UN'} onChange={handleInputChange} className="mt-1 p-2 border rounded bg-white w-full">
                            <option value="UN">Unidade (UN)</option>
                            <option value="KG">Quilograma (KG)</option>
                            <option value="PC">Peça (PC)</option>
                            <option value="CX">Caixa (CX)</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="weight" className="block text-sm font-medium text-gray-700">Peso (kg)</label>
                        <input type="number" step="0.01" id="weight" name="weight" value={editingProduct.weight || ''} onChange={handleInputChange} className="mt-1 p-2 border rounded w-full"/>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="dimensions.length" className="block text-sm font-medium text-gray-700">Comprimento (cm)</label>
                        <input type="number" step="0.01" id="dimensions.length" name="dimensions.length" value={editingProduct.dimensions?.length || ''} onChange={handleDimensionChange} className="mt-1 p-2 border rounded w-full"/>
                    </div>
                    <div>
                        <label htmlFor="dimensions.width" className="block text-sm font-medium text-gray-700">Largura (cm)</label>
                        <input type="number" step="0.01" id="dimensions.width" name="dimensions.width" value={editingProduct.dimensions?.width || ''} onChange={handleDimensionChange} className="mt-1 p-2 border rounded w-full"/>
                    </div>
                     <div>
                        <label htmlFor="dimensions.height" className="block text-sm font-medium text-gray-700">Altura (cm)</label>
                        <input type="number" step="0.01" id="dimensions.height" name="dimensions.height" value={editingProduct.dimensions?.height || ''} onChange={handleDimensionChange} className="mt-1 p-2 border rounded w-full"/>
                    </div>
                </div>
            </div>

            <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-600 mb-2">Informações Fiscais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="ncm" className="block text-sm font-medium text-gray-700">NCM</label>
                        <input type="text" id="ncm" name="ncm" value={editingProduct.ncm || ''} onChange={handleInputChange} className="mt-1 p-2 border rounded w-full"/>
                    </div>
                    <div>
                        <label htmlFor="cest" className="block text-sm font-medium text-gray-700">CEST (opcional)</label>
                        <input type="text" id="cest" name="cest" value={editingProduct.cest || ''} onChange={handleInputChange} className="mt-1 p-2 border rounded w-full"/>
                    </div>
                </div>
            </div>

            <div className="mt-6 flex justify-end sticky bottom-0 bg-white py-4 -mx-6 px-6 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg mr-2 hover:bg-gray-300">Cancelar</button>
                <button type="button" onClick={handleSaveProduct} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Salvar</button>
            </div>
        </form>
        )}
      </Modal>

      <Modal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} title="Gerenciar Categorias">
          <div className="space-y-4">
              <h4 className="font-semibold text-gray-700">Adicionar Nova Categoria</h4>
              <form onSubmit={handleAddCategory} className="flex gap-2">
                  <input 
                      type="text" 
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Nome da categoria"
                      className="p-2 border rounded-md flex-grow"
                  />
                  <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex-shrink-0">Adicionar</button>
              </form>
          </div>
          <div className="mt-6 border-t pt-4">
              <h4 className="font-semibold text-gray-700 mb-2">Categorias Existentes</h4>
              <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {categories.map(cat => (
                      <li key={cat.id} className="flex justify-between items-center bg-gray-100 p-2 rounded-md">
                          <span className="text-gray-800">{cat.name}</span>
                          <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-500 hover:text-red-700" aria-label={`Excluir categoria ${cat.name}`}>
                              <Trash2 size={16} />
                          </button>
                      </li>
                  ))}
              </ul>
          </div>
      </Modal>

       <Modal isOpen={isBrandModalOpen} onClose={() => setIsBrandModalOpen(false)} title="Gerenciar Marcas">
          <div className="space-y-4">
              <h4 className="font-semibold text-gray-700">Adicionar Nova Marca</h4>
              <form onSubmit={handleAddBrand} className="flex gap-2">
                  <input 
                      type="text" 
                      value={newBrandName}
                      onChange={(e) => setNewBrandName(e.target.value)}
                      placeholder="Nome da marca"
                      className="p-2 border rounded-md flex-grow"
                  />
                  <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex-shrink-0">Adicionar</button>
              </form>
          </div>
          <div className="mt-6 border-t pt-4">
              <h4 className="font-semibold text-gray-700 mb-2">Marcas Existentes</h4>
              <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {brands.map(b => (
                      <li key={b.id} className="flex justify-between items-center bg-gray-100 p-2 rounded-md">
                          <span className="text-gray-800">{b.name}</span>
                          <button onClick={() => handleDeleteBrand(b.id)} className="text-red-500 hover:text-red-700" aria-label={`Excluir marca ${b.name}`}>
                              <Trash2 size={16} />
                          </button>
                      </li>
                  ))}
              </ul>
          </div>
      </Modal>

      <Modal isOpen={isSupplierModalOpen} onClose={() => setIsSupplierModalOpen(false)} title="Gerenciar Fornecedores">
          <div className="space-y-4">
              <h4 className="font-semibold text-gray-700">Adicionar Novo Fornecedor</h4>
              <form onSubmit={handleAddSupplier} className="flex gap-2">
                  <input 
                      type="text" 
                      value={newSupplierName}
                      onChange={(e) => setNewSupplierName(e.target.value)}
                      placeholder="Nome do fornecedor"
                      className="p-2 border rounded-md flex-grow"
                  />
                  <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex-shrink-0">Adicionar</button>
              </form>
          </div>
          <div className="mt-6 border-t pt-4">
              <h4 className="font-semibold text-gray-700 mb-2">Fornecedores Existentes</h4>
              <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {suppliers.map(s => (
                      <li key={s.id} className="flex justify-between items-center bg-gray-100 p-2 rounded-md">
                          <span className="text-gray-800">{s.name}</span>
                          <button onClick={() => handleDeleteSupplier(s.id)} className="text-red-500 hover:text-red-700" aria-label={`Excluir fornecedor ${s.name}`}>
                              <Trash2 size={16} />
                          </button>
                      </li>
                  ))}
              </ul>
          </div>
      </Modal>

      <Modal isOpen={isPrintModalOpen} onClose={() => setIsPrintModalOpen(false)} title="Selecionar Colunas para Impressão">
        <div className="space-y-2">
          <p className="text-sm text-gray-600 mb-4">Escolha as informações que deseja incluir na impressão.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {availableColumnsForPrint.map(col => (
              <label key={col.key} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={!!selectedPrintColumns[col.key]}
                  onChange={() => handleColumnSelectionChange(col.key)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-gray-700">{col.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button type="button" onClick={() => setIsPrintModalOpen(false)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg mr-2 hover:bg-gray-300">Cancelar</button>
          <button type="button" onClick={handleInitiatePrint} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Imprimir</button>
        </div>
      </Modal>

      <div id="products-dynamic-print-area">
        {printableContent}
      </div>
    </div>
  );
};

export default Products;