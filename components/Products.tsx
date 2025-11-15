
import React, { useState } from 'react';
import { MOCK_PRODUCTS } from '../constants';
import { type Product } from '../types';
import { DataTable } from './shared/DataTable';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Modal from './shared/Modal';


const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selection, setSelection] = useState<string[]>([]);

  const columns = [
    { header: 'SKU', accessor: 'sku' as keyof Product },
    { header: 'Nome', accessor: 'name' as keyof Product },
    { header: 'Categoria', accessor: 'category' as keyof Product },
    { header: 'Preço', accessor: (item: Product) => `R$ ${item.price.toFixed(2)}` },
    { header: 'Estoque', accessor: 'stock' as keyof Product },
  ];
  
  const handleAddNew = () => {
      // Logic to add a new product
      setIsModalOpen(false);
  }

  const handleBulkDelete = () => {
    if (window.confirm(`Tem certeza que deseja excluir ${selection.length} produto(s)?`)) {
      setProducts(prev => prev.filter(p => !selection.includes(p.id)));
      setSelection([]);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Produtos</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700 transition-colors">
          <Plus size={20} className="mr-2" />
          Novo Produto
        </button>
      </div>

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

      <DataTable<Product>
        columns={columns}
        data={products}
        selection={selection}
        onSelectionChange={setSelection}
        renderActions={(item) => (
          <div className="flex space-x-2">
            <button className="text-yellow-600 hover:text-yellow-900"><Edit size={18} /></button>
            <button className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
          </div>
        )}
      />

       <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Adicionar Novo Produto">
        <form>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Nome do Produto" className="p-2 border rounded"/>
                <input type="text" placeholder="SKU" className="p-2 border rounded"/>
                <input type="number" placeholder="Preço" className="p-2 border rounded"/>
                <input type="number" placeholder="Estoque" className="p-2 border rounded"/>
                <input type="text" placeholder="Categoria" className="p-2 border rounded col-span-2"/>
            </div>
            <div className="mt-6 flex justify-end">
                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg mr-2 hover:bg-gray-300">Cancelar</button>
                <button type="button" onClick={handleAddNew} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Salvar</button>
            </div>
        </form>
      </Modal>
    </div>
  );
};

export default Products;
