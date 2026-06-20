import { supabase } from './supabase';

// --- CATEGORÍAS ---

export const getCategories = async (userId) => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return data;
};

export const createCategory = async (userId, name, type) => {
  const { data, error } = await supabase
    .from('categories')
    .insert([{ user_id: userId, name, type }])
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const ensureDefaultCategories = async (userId) => {
  const existing = await getCategories(userId);
  if (existing.length === 0) {
    await supabase.from('categories').insert([
      { user_id: userId, name: 'Importantes', type: 'expense', is_default: true },
      { user_id: userId, name: 'Gustos', type: 'expense', is_default: true },
      { user_id: userId, name: 'Otros', type: 'expense', is_default: true },
      { user_id: userId, name: 'Salario/Ingresos', type: 'income', is_default: true }
    ]);
  }
};

// --- TRANSACCIONES ---

export const getTransactions = async (userId) => {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      categories (
        name
      )
    `)
    .eq('user_id', userId)
    .order('date', { ascending: false });
  if (error) throw error;
  return data;
};

export const createTransaction = async (userId, categoryId, amount, type, description) => {
  const { data, error } = await supabase
    .from('transactions')
    .insert([{ user_id: userId, category_id: categoryId, amount, type, description }])
    .select()
    .single();
  if (error) throw error;
  return data;
};

// --- DEUDAS ---

export const getDebts = async (userId) => {
  const { data, error } = await supabase
    .from('debts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const createDebt = async (userId, name, totalAmount, dueDate) => {
  const { data, error } = await supabase
    .from('debts')
    .insert([{ user_id: userId, name, total_amount: totalAmount, due_date: dueDate }])
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const payDebt = async (userId, debtId, amountToPay, currentPaid) => {
  await supabase
    .from('debt_payments')
    .insert([{ user_id: userId, debt_id: debtId, amount: amountToPay }]);
    
  const newPaidAmount = parseFloat(currentPaid) + parseFloat(amountToPay);
  
  const { data, error } = await supabase
    .from('debts')
    .update({ paid_amount: newPaidAmount })
    .eq('id', debtId)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

export const getDebtPayments = async (userId) => {
  const { data, error } = await supabase
    .from('debt_payments')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return data;
};
