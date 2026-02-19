export const EXPENSE_CATEGORIES = [
  'Groceries','Utilities','Entertainment','Dining Out',
  'Transportation','Healthcare','Clothing','Education','Rent','Other',
];

export const INCOME_SOURCES = ['Salary','Freelance','Bonus','Investment','Rental','Other'];
export const INCOME_FREQUENCIES = ['One-time','Daily','Weekly','Monthly','Yearly'];

export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export const CATEGORY_COLORS = {
  Groceries: '#4fffb0',
  Utilities: '#74b9ff',
  Entertainment: '#ffd166',
  'Dining Out': '#ff7675',
  Transportation: '#a29bfe',
  Healthcare: '#fd79a8',
  Clothing: '#00cec9',
  Education: '#fdcb6e',
  Rent: '#e17055',
  Other: '#6b7394',
};

export const getCurrentMonthYear = () => {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
};
