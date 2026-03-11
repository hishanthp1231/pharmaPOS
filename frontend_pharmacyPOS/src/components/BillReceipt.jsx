import React from 'react';

export default function BillReceipt({ order, onClose, printMode }) {
  if (!order) return null;
  const {
    id,
    customerName = 'Walk-in Customer',
    cart = [],
    date,
    paymentMethod,
    subtotal = 0,
    discount = { type: 'percentage', value: 0, amount: 0 },
    tax = { rate: 0.18, amount: 0 },
    total = 0,
    paidAmount = 0,
    futureCredit = 0,
    billingSettings = { taxPercentage: 18, receiptFooter: 'Thank you for your business!' },
    cashier = 'System',
    branch = { name: 'Main Pharmacy', address: '123 Pharmacy St, Colombo', tel: '011-2345678' }
  } = order;

  const change = Math.max(0, paidAmount - total);
  const taxRatePercent = (tax.rate || (billingSettings.taxPercentage / 100) || 0.18) * 100;

  const ReceiptContent = () => (
    <div className="receipt-container" style={{
      width: '300px',
      padding: '16px',
      backgroundColor: '#fff',
      color: '#000',
      fontSize: '11px',
      lineHeight: '1.4',
      margin: '0 auto'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '15px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 5px 0' }}>{branch.name}</h2>
        <p style={{ margin: '0', fontSize: '10px' }}>{branch.address}</p>
        <p style={{ margin: '0', fontSize: '10px' }}>Tel: {branch.tel}</p>
        <div style={{ borderBottom: '1.5px dashed #333', margin: '10px 0' }} />
        <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: '5px 0' }}>CASH RECEIPT</h3>
        <div style={{ borderBottom: '1.5px dashed #333', margin: '10px 0' }} />
      </div>

      {/* Info Section */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Inv No:</span>
          <span>{id}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Date:</span>
          <span>{date ? new Date(date).toLocaleDateString() : ''} {date ? new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Cashier:</span>
          <span>{cashier}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Customer:</span>
          <span>{customerName}</span>
        </div>
      </div>

      <div style={{ borderBottom: '1px dashed #555', margin: '8px 0' }} />

      {/* Table Header */}
      <div style={{ display: 'flex', fontWeight: 'bold', marginBottom: '5px' }}>
        <span style={{ flex: '2' }}>Description</span>
        <span style={{ flex: '0.8', textAlign: 'center' }}>Qty</span>
        <span style={{ flex: '1.2', textAlign: 'right' }}>Price</span>
        <span style={{ flex: '1.2', textAlign: 'right' }}>Total</span>
      </div>

      <div style={{ borderBottom: '1px dashed #555', marginBottom: '8px' }} />

      {/* Items */}
      <div style={{ marginBottom: '10px' }}>
        {cart.map((item, idx) => (
          <div key={idx} style={{ marginBottom: '6px' }}>
            <div style={{ fontWeight: 'bold' }}>{item.name}</div>
            <div style={{ display: 'flex', fontSize: '10px' }}>
              <span style={{ flex: '2' }}>
                {item.selectedVariants && Object.values(item.selectedVariants).length > 0 && (
                  <span style={{ fontSize: '9px', color: '#666' }}>
                    ({Object.values(item.selectedVariants).map(v => v.name).join(', ')})
                  </span>
                )}
              </span>
              <span style={{ flex: '0.8', textAlign: 'center' }}>{item.qty}</span>
              <span style={{ flex: '1.2', textAlign: 'right' }}>{item.price.toFixed(2)}</span>
              <span style={{ flex: '1.2', textAlign: 'right' }}>{(item.price * item.qty).toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ borderBottom: '1.5px dashed #333', margin: '10px 0' }} />

      {/* Summary */}
      <div style={{ fontSize: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
          <span>Subtotal</span>
          <span>LKR {subtotal.toFixed(2)}</span>
        </div>
        {discount?.amount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span>Discount ({discount.type === 'percentage' ? `${discount.value}%` : `LKR ${discount.value}`})</span>
            <span>-LKR {discount.amount.toFixed(2)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
          <span>Tax ({taxRatePercent}%)</span>
          <span>LKR {tax.amount.toFixed(2)}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', marginTop: '5px', borderTop: '1px solid #000', paddingTop: '5px' }}>
          <span>GRAND TOTAL</span>
          <span>LKR {total.toFixed(2)}</span>
        </div>

        <div style={{ borderBottom: '1px dotted #888', margin: '8px 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
          <span>Cash Paid</span>
          <span>LKR {paidAmount.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
          <span>Balance Change</span>
          <span>LKR {change.toFixed(2)}</span>
        </div>
        {futureCredit > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontStyle: 'italic' }}>
            <span>Future Credit</span>
            <span>LKR {futureCredit.toFixed(2)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginTop: '5px' }}>
          <span>Payment Method:</span>
          <span>{String(paymentMethod || '').toUpperCase()}</span>
        </div>
      </div>

      <div style={{ borderBottom: '1.5px dashed #333', margin: '15px 0' }} />

      {/* Footer */}
      <div style={{ textAlign: 'center' }}>
        <p style={{ margin: '5px 0', fontWeight: 'bold' }}>{billingSettings.receiptFooter}</p>
        <p style={{ fontSize: '9px', margin: '5px 0' }}>Powered by Pharmacy POS</p>
        {/* Barcode placeholder */}
        <div style={{
          width: '180px',
          height: '30px',
          background: 'repeating-linear-gradient(90deg, #000 0 1px, #fff 1px 3px)',
          margin: '10px auto'
        }} />
        <p style={{ fontSize: '8px' }}>* No exchange without bill *</p>
      </div>
    </div>
  );

  if (printMode) {
    return (
      <div className="print-receipt">
        <ReceiptContent />
        <style>{`
          @media print {
            body * { visibility: hidden !important; }
            .print-receipt, .print-receipt * { visibility: visible !important; }
            .print-receipt {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              display: flex !important;
              justify-content: center !important;
              background-color: white !important;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl relative max-h-[90vh] overflow-y-auto print-receipt">
        <div className="p-2 border-b flex justify-end sticky top-0 bg-white z-10">
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <ReceiptContent />
      </div>
      <style>{`
        @media print {
          html, body {
            height: auto !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          body * { visibility: hidden !important; }
          .print-receipt, .print-receipt * { visibility: visible !important; }
          .print-receipt {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            display: flex !important;
            justify-content: center !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
          .receipt-container {
            width: 300px !important;
            margin: 0 auto !important;
            padding: 10px !important;
          }
        }
      `}</style>
    </div>
  );
}
