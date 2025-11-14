
import React from 'react';
import { type Invoice } from '../../types';

interface DanfeViewProps {
  invoice: Invoice;
}

const DanfeView: React.FC<DanfeViewProps> = ({ invoice }) => {
    const barcodeUrl = `https://barcode.tec-it.com/barcode.ashx?data=${invoice.accessKey.replace(/\s/g, '')}&code=Code128&translate-esc=on`;

    const Box: React.FC<{title: string; children: React.ReactNode; className?: string; titleClassName?: string}> = ({title, children, className, titleClassName}) => (
        <div className={`border border-black ${className}`}>
            <h2 className={`text-[6px] font-sans px-1 uppercase ${titleClassName}`}>{title}</h2>
            <div className="text-xs font-bold p-1">{children}</div>
        </div>
    );
    
    const TaxBox: React.FC<{title: string; value: number;}> = ({title, value}) => (
         <Box title={title} className="text-right">
            {value > 0 ? value.toFixed(2) : ''}
        </Box>
    );

  return (
    <div id="danfe-print-area" className="p-4 bg-white font-serif text-black">
      <div className="border-2 border-black p-1">
        <header className="flex border-b-2 border-black">
            <div className="w-1/2 flex items-center p-2">
                <div>
                    <h1 className="text-lg font-bold">{invoice.issuer.legalName}</h1>
                    <p className="text-xs">{invoice.issuer.address}</p>
                </div>
            </div>
            <div className="w-1/2 flex items-center border-l-2 border-black">
                <div className="w-1/3 text-center p-2">
                    <h2 className="text-2xl font-bold">DANFE</h2>
                    <p className="text-[7px] font-sans leading-tight">Documento Auxiliar da Nota Fiscal Eletrônica</p>
                    <p className="text-[7px] font-sans leading-tight">0 - ENTRADA</p>
                    <p className="text-[7px] font-sans leading-tight font-bold">1 - SAÍDA</p>
                </div>
                <div className="w-2/3 p-2 text-xs">
                    <p><strong>Nº.</strong> <span className="text-base font-bold">{invoice.id}</span></p>
                    <p><strong>SÉRIE:</strong> {invoice.series}</p>
                </div>
            </div>
        </header>
        <section className="flex">
            <div className="w-1/2 p-2">
                 <Box title="Natureza da Operação">Venda de Mercadoria</Box>
                 <Box title="Protocolo de Autorização de Uso" className="mt-1">{invoice.protocol}</Box>
            </div>
             <div className="w-1/2 p-2 border-l-2 border-black">
                 <Box title="Chave de Acesso" className="text-center text-sm tracking-wide">
                    {invoice.accessKey}
                 </Box>
                 <img src={barcodeUrl} alt="Barcode" className="w-full h-12 mt-1 object-contain"/>
            </div>
        </section>
        <section className="border-t-2 border-black p-2">
            <h2 className="text-center text-xs font-sans font-bold mb-1">DADOS DO EMITENTE</h2>
            <div className="grid grid-cols-4 gap-px">
                <Box title="Razão Social" className="col-span-3">{invoice.issuer.legalName}</Box>
                <Box title="CNPJ">{invoice.issuer.document}</Box>
                <Box title="Endereço" className="col-span-4">{invoice.issuer.address}</Box>
                <Box title="Inscrição Estadual">{invoice.issuer.stateRegistration}</Box>
                <Box title="Inscrição Estadual Subst. Trib."></Box>
            </div>
        </section>
        <section className="border-t-2 border-black p-2">
            <h2 className="text-center text-xs font-sans font-bold mb-1">DESTINATÁRIO / REMETENTE</h2>
            <div className="grid grid-cols-5 gap-px">
                <Box title="Nome / Razão Social" className="col-span-3">{invoice.customer.name}</Box>
                <Box title="CNPJ / CPF">{invoice.customer.document}</Box>
                <Box title="Data de Emissão">{invoice.issueDate}</Box>
                <Box title="Endereço" className="col-span-4">{invoice.customer.address}</Box>
                <Box title="Data de Saída">{invoice.exitDate}</Box>
                <Box title="Bairro / Distrito"></Box>
                <Box title="CEP"></Box>
                <Box title="Município"></Box>
                <Box title="Fone / Fax">{invoice.customer.phone}</Box>
                <Box title="UF"></Box>
                <Box title="Hora da Saída"></Box>
            </div>
        </section>

        <section className="border-t-2 border-black p-2">
             <h2 className="text-center text-xs font-sans font-bold mb-1">CÁLCULO DO IMPOSTO</h2>
             <div className="grid grid-cols-6 gap-px">
                <TaxBox title="Base de Cálculo do ICMS" value={invoice.taxInfo.baseICMS}/>
                <TaxBox title="Valor do ICMS" value={invoice.taxInfo.valueICMS}/>
                <TaxBox title="Base de Cálculo ICMS ST" value={invoice.taxInfo.baseST}/>
                <TaxBox title="Valor do ICMS ST" value={invoice.taxInfo.valueST}/>
                <TaxBox title="Valor Total dos Produtos" value={invoice.totalProducts}/>
                <TaxBox title="Valor Total da Nota" value={invoice.totalInvoice}/>
             </div>
        </section>

        <section className="border-t-2 border-black p-2">
             <h2 className="text-center text-xs font-sans font-bold mb-1">DADOS DOS PRODUTOS / SERVIÇOS</h2>
             <table className="w-full border-collapse border border-black text-[8px]">
                <thead>
                    <tr className="border border-black text-center font-sans font-bold">
                        <td className="p-1 border border-black">CÓD PROD</td>
                        <td className="p-1 border border-black">DESCRIÇÃO DO PRODUTO / SERVIÇO</td>
                        <td className="p-1 border border-black">NCM/SH</td>
                        <td className="p-1 border border-black">CSOSN</td>
                        <td className="p-1 border border-black">CFOP</td>
                        <td className="p-1 border border-black">UN</td>
                        <td className="p-1 border border-black">QTD</td>
                        <td className="p-1 border border-black">VLR UNIT</td>
                        <td className="p-1 border border-black">VLR TOTAL</td>
                    </tr>
                </thead>
                <tbody>
                    {invoice.items.map(item => (
                        <tr key={item.id}>
                             <td className="p-1 border border-black">{item.code}</td>
                             <td className="p-1 border border-black">{item.description}</td>
                             <td className="p-1 border border-black text-center">{item.ncm}</td>
                             <td className="p-1 border border-black text-center">{item.csosn}</td>
                             <td className="p-1 border border-black text-center">{item.cfop}</td>
                             <td className="p-1 border border-black text-center">{item.unit}</td>
                             <td className="p-1 border border-black text-right">{item.quantity.toFixed(2)}</td>
                             <td className="p-1 border border-black text-right">{item.unitPrice.toFixed(2)}</td>
                             <td className="p-1 border border-black text-right">{item.totalPrice.toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
             </table>
        </section>

        <footer className="border-t-2 border-black mt-4 p-2">
            <Box title="Dados Adicionais - Informações Complementares">
                <p className="text-[9px]">Documento emitido por ME ou EPP optante pelo Simples Nacional. Não gera direito a crédito fiscal de IPI.</p>
            </Box>
        </footer>

        <div className="border-t-2 border-dashed border-black mt-8 text-center text-xs p-2">
            <p><strong>CANHOTO - RECEBEMOS DE {invoice.issuer.name} OS PRODUTOS CONSTANTES DA NOTA FISCAL INDICADA AO LADO</strong></p>
            <div className="flex justify-between mt-8">
                <p><strong>DATA DE RECEBIMENTO:</strong> ____/____/________</p>
                <p><strong>ASSINATURA:</strong> ___________________________________</p>
            </div>
        </div>

      </div>
    </div>
  );
};

export default DanfeView;
