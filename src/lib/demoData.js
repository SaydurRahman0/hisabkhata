/**
 * Demo data for Phase 01 design system preview.
 * This represents realistic transactional records for small retail & wholesale stores in Bangladesh
 * (grocery, general store, hardware, stationery, clothing).
 * 
 * NOTE: This is purely static preview data to demonstrate UI layouts,
 * typography, and contrast. Real data persistence will be handled in Phase 02 with MongoDB.
 */

export const DEMO_SUMMARY_DATA = {
  todaySales: 18450,
  cashCollectedToday: 14200,
  newCreditToday: 4250,
  totalOutstandingDues: 84700,
  activeCustomersWithDue: 18,
  totalProductsInStock: 246,
  lowStockItemsCount: 7
};

export const DEMO_TRANSACTIONS = [
  {
    id: 'TXN-9041',
    time: '11:45 AM',
    customerName: {
      bn: 'হাজী মোঃ আবুল কাশেম',
      en: 'Haji Md. Abul Kashem'
    },
    phone: '01711-234567',
    customerLocation: {
      bn: 'মৌলভীবাজার রোড',
      en: 'Moulvibazar Road'
    },
    itemsSummary: {
      bn: 'তীর সয়াবিন তেল (৫ লিটার) ও চিনি (৫ কেজি)',
      en: 'Teer Soybean Oil (5L) & Sugar (5kg)'
    },
    type: 'cash_sale', // cash_sale | credit_sale | due_collection
    amount: 3850,
    status: 'paid', // paid | due | collected
    receiptNo: 'REC-1082'
  },
  {
    id: 'TXN-9040',
    time: '11:20 AM',
    customerName: {
      bn: 'মোহাম্মদ রফিকুল ইসলাম',
      en: 'Md. Rafiqul Islam'
    },
    phone: '01819-876543',
    customerLocation: {
      bn: 'বেগমবাজার লেন',
      en: 'Begumbazar Lane'
    },
    itemsSummary: {
      bn: 'পূর্বের খাতার বকেয়া নগদ পরিশোধ',
      en: 'Cash settlement of previous ledger due'
    },
    type: 'due_collection',
    amount: 5000,
    status: 'collected',
    receiptNo: 'COL-0491'
  },
  {
    id: 'TXN-9039',
    time: '10:55 AM',
    customerName: {
      bn: 'কামাল আহমেদ',
      en: 'Kamal Ahmed'
    },
    phone: '01912-345678',
    customerLocation: {
      bn: 'ইমামগঞ্জ মার্কেট',
      en: 'Imamganj Market'
    },
    itemsSummary: {
      bn: 'প্রাণ সুগন্ধি চাল (২৫ কেজি বস্তা)',
      en: 'Pran Aromatic Rice (25kg sack)'
    },
    type: 'credit_sale',
    amount: 2400,
    status: 'due',
    receiptNo: 'REC-1081'
  },
  {
    id: 'TXN-9038',
    time: '10:15 AM',
    customerName: {
      bn: 'মোঃ তারেক হাসান',
      en: 'Md. Tareq Hasan'
    },
    phone: '01678-901234',
    customerLocation: {
      bn: 'রহমতগঞ্জ',
      en: 'Rahmatganj'
    },
    itemsSummary: {
      bn: 'তীর ময়দা ও ফ্রেশ আটা (১০ প্যাকেট)',
      en: 'Teer Flour & Fresh Atta (10 packets)'
    },
    type: 'credit_sale',
    amount: 1850,
    status: 'due',
    receiptNo: 'REC-1080'
  },
  {
    id: 'TXN-9037',
    time: '09:40 AM',
    customerName: {
      bn: 'সুমন মিয়া',
      en: 'Sumon Mia'
    },
    phone: '01552-456789',
    customerLocation: {
      bn: 'লালবাগ কেল্লা মোড়',
      en: 'Lalbagh Fort Crossing'
    },
    itemsSummary: {
      bn: 'বাকি কিস্তি পরিশোধ (রসিদ নং ৮৭২)',
      en: 'Due installment payment (Receipt #872)'
    },
    type: 'due_collection',
    amount: 3200,
    status: 'collected',
    receiptNo: 'COL-0490'
  },
  {
    id: 'TXN-9036',
    time: '09:10 AM',
    customerName: {
      bn: 'আনোয়ার হোসেন',
      en: 'Anwar Hossain'
    },
    phone: '01723-654987',
    customerLocation: {
      bn: 'মিটফোর্ড ঘাট',
      en: 'Mitford Ghat'
    },
    itemsSummary: {
      bn: 'সাবান, ডিটারজেন্ট ও চা পাতা পাইকারি লট',
      en: 'Soap, detergent & tea leaves wholesale'
    },
    type: 'cash_sale',
    amount: 6250,
    status: 'paid',
    receiptNo: 'REC-1079'
  },
  {
    id: 'TXN-9035',
    time: '08:35 AM',
    customerName: {
      bn: 'দেলোয়ার হোসেন',
      en: 'Delwar Hossain'
    },
    phone: '01834-112233',
    customerLocation: {
      bn: 'বাবুবাজার ব্রিজ রোড',
      en: 'Babubazar Bridge Road'
    },
    itemsSummary: {
      bn: 'মোল্লা সুপার সল্ট ও মসুর ডাল',
      en: 'Molla Super Salt & Red Lentils'
    },
    type: 'cash_sale',
    amount: 4100,
    status: 'paid',
    receiptNo: 'REC-1078'
  }
];

export const DEMO_HIGH_DUES = [
  {
    id: 'DUE-01',
    customerName: {
      bn: 'আব্দুল করিম সরকার',
      en: 'Abdul Karim Sarker'
    },
    phone: '01715-998877',
    totalDue: 18500,
    daysOverdue: 24,
    lastPaymentDate: {
      bn: '২৮ সেপ্টেম্বর',
      en: '28 Sep'
    }
  },
  {
    id: 'DUE-02',
    customerName: {
      bn: 'মেসার্স ভাই ভাই এন্টারপ্রাইজ',
      en: 'M/S Bhai Bhai Enterprise'
    },
    phone: '01822-334455',
    totalDue: 14200,
    daysOverdue: 19,
    lastPaymentDate: {
      bn: '০৩ অক্টোবর',
      en: '03 Oct'
    }
  },
  {
    id: 'DUE-03',
    customerName: {
      bn: 'নূরজাহান স্টোর (কবির মিয়া)',
      en: 'Nurjahan Store (Kabir Mia)'
    },
    phone: '01933-556677',
    totalDue: 11800,
    daysOverdue: 16,
    lastPaymentDate: {
      bn: '০৬ অক্টোবর',
      en: '06 Oct'
    }
  }
];
