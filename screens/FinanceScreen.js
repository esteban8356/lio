import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Platform, Alert, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { PieChart } from 'react-native-gifted-charts';
import * as financeService from '../lib/financeService';

// Colores para las categorías dinámicas
const chartColors = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6'];
const incomeColors = ['#10b981', '#34d399', '#6ee7b7', '#059669', '#047857'];

export default function FinanceScreen() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768; // Para detectar tablets y web

  // Fecha actual (mes seleccionado)
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Modals state para Transacciones
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionType, setTransactionType] = useState('expense'); // 'income' or 'expense'
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);

  // Modals state para Deudas
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [debtName, setDebtName] = useState('');
  const [debtTotal, setDebtTotal] = useState('');
  const [debtDueDate, setDebtDueDate] = useState('');

  // Modals state para Pagar Deuda
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [payAmount, setPayAmount] = useState('');

  // Datos sin procesar
  const [rawTransactions, setRawTransactions] = useState([]);
  const [rawDebtPayments, setRawDebtPayments] = useState([]);
  const [debts, setDebts] = useState([]);
  const [visibleDebts, setVisibleDebts] = useState([]);
  const [categories, setCategories] = useState([]);

  // Datos procesados (del mes seleccionado)
  const [balance, setBalance] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [totalPaidDebt, setTotalPaidDebt] = useState(0);
  const [totalPendingDebt, setTotalPendingDebt] = useState(0);

  const [pieData, setPieData] = useState([]);
  const [pieLegend, setPieLegend] = useState([]);
  const [incomePieData, setIncomePieData] = useState([]);
  const [incomePieLegend, setIncomePieLegend] = useState([]);
  const [debtVsExpensePieData, setDebtVsExpensePieData] = useState([]);
  const [debtVsExpensePieLegend, setDebtVsExpensePieLegend] = useState([]);
  const [balanceTrendData, setBalanceTrendData] = useState([{value: 0, label: '1'}]);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setUserId(session.user.id);
          await financeService.ensureDefaultCategories(session.user.id);
          await fetchRealData(session.user.id);
        }
      } catch (err) {
        console.log('Error loading data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (!loading) {
      processFilteredData();
    }
  }, [currentMonth, rawTransactions, rawDebtPayments, debts]);

  const fetchRealData = async (uid) => {
    try {
      const cats = await financeService.getCategories(uid);
      setCategories(cats);

      const txs = await financeService.getTransactions(uid);
      setRawTransactions(txs);

      const dbs = await financeService.getDebts(uid);
      setDebts(dbs);

      const dpays = await financeService.getDebtPayments(uid);
      setRawDebtPayments(dpays);
    } catch (e) {
      console.log('Error fetching data:', e);
    }
  };

  const processFilteredData = () => {
    let income = 0;
    let expense = 0;
    let expensesByCategory = {};
    let incomesByCategory = {};

    const targetMonth = currentMonth.getMonth();
    const targetYear = currentMonth.getFullYear();

    // 1. Filtrar transacciones por mes
    rawTransactions.forEach(tx => {
      // Use date si existe, sino created_at
      const txDate = new Date(tx.date || tx.created_at);
      if (txDate.getMonth() === targetMonth && txDate.getFullYear() === targetYear) {
        const val = Number(tx.amount);
        if (tx.type === 'income') {
          income += val;
          const catName = tx.categories?.name || 'Desconocido';
          incomesByCategory[catName] = (incomesByCategory[catName] || 0) + val;
        } else if (tx.type === 'expense') {
          expense += val;
          const catName = tx.categories?.name || 'Desconocido';
          expensesByCategory[catName] = (expensesByCategory[catName] || 0) + val;
        }
      }
    });

    // 2. Filtrar pagos de deuda por mes
    let paidDebtThisMonth = 0;
    rawDebtPayments.forEach(dp => {
      const dpDate = new Date(dp.created_at);
      if (dpDate.getMonth() === targetMonth && dpDate.getFullYear() === targetYear) {
        paidDebtThisMonth += Number(dp.amount);
      }
    });

    // 3. Deuda pendiente histórica (al final del mes seleccionado) y Deuda nueva del mes
    const endOfSelectedMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

    let historicalPendingDebt = 0;
    let newDebtThisMonth = 0;
    const debtsForThisMonth = [];

    debts.forEach(d => {
      const debtDate = new Date(d.created_at);
      
      // Calcular deuda adquirida ESTE mes
      if (debtDate.getMonth() === targetMonth && debtDate.getFullYear() === targetYear) {
        newDebtThisMonth += Number(d.total_amount);
      }

      // Solo consideramos la deuda si fue creada antes o durante este mes
      if (debtDate <= endOfSelectedMonth) {
        let paymentsUpToMonth = 0;
        rawDebtPayments.forEach(dp => {
          if (dp.debt_id === d.id) {
            const dpDate = new Date(dp.created_at);
            if (dpDate <= endOfSelectedMonth) {
              paymentsUpToMonth += Number(dp.amount);
            }
          }
        });

        const remaining = Number(d.total_amount) - paymentsUpToMonth;
        
        const debtAsOfMonth = {
            ...d,
            paid_amount: paymentsUpToMonth,
            is_paid: remaining <= 0
        };

        // Incluimos en la vista si aún había deuda o si se acaba de pagar
        debtsForThisMonth.push(debtAsOfMonth);

        if (remaining > 0) {
          historicalPendingDebt += remaining;
        }
      }
    });

    setTotalIncome(income);
    setTotalExpense(expense);
    setTotalPaidDebt(paidDebtThisMonth);
    setTotalPendingDebt(historicalPendingDebt);
    setVisibleDebts(debtsForThisMonth);
    setBalance(income - expense);

    // 4. Formatear Diagrama de Torta (Distribución de Salidas)
    const totalOutflow = expense + paidDebtThisMonth;
    if (totalOutflow > 0) {
      const newPieData = [];
      const newPieLegend = [];
      let colorIndex = 0;

      Object.keys(expensesByCategory).forEach(catName => {
        const value = expensesByCategory[catName];
        const percentage = ((value / totalOutflow) * 100).toFixed(0);
        const color = chartColors[colorIndex % chartColors.length];
        
        newPieData.push({ value, color, text: `${percentage}%` });
        newPieLegend.push({ name: `${catName}`, color, percentage });
        colorIndex++;
      });

      if (paidDebtThisMonth > 0) {
        const percentage = ((paidDebtThisMonth / totalOutflow) * 100).toFixed(0);
        const color = '#3b82f6';
        newPieData.push({ value: paidDebtThisMonth, color, text: `${percentage}%` });
        newPieLegend.push({ name: 'Pago Deudas', color, percentage });
      }
      
      setPieData(newPieData);
      setPieLegend(newPieLegend);
    } else {
      setPieData([{ value: 100, color: '#e2e8f0', text: '0%' }]);
      setPieLegend([]);
    }

    // 5. Formatear Diagrama de Torta (Ingresos)
    if (income > 0) {
      const newIncPieData = [];
      const newIncPieLegend = [];
      let colorIndex = 0;

      Object.keys(incomesByCategory).forEach(catName => {
        const value = incomesByCategory[catName];
        const percentage = ((value / income) * 100).toFixed(0);
        const color = incomeColors[colorIndex % incomeColors.length];
        
        newIncPieData.push({ value, color, text: `${percentage}%` });
        newIncPieLegend.push({ name: `${catName}`, color, percentage });
        colorIndex++;
      });
      setIncomePieData(newIncPieData);
      setIncomePieLegend(newIncPieLegend);
    } else {
      setIncomePieData([{ value: 100, color: '#e2e8f0', text: '0%' }]);
      setIncomePieLegend([]);
    }

    // 6. Formatear Diagrama Ingresos vs Gastos vs Nueva Deuda
    const totalExpVsNewDebt = income + expense + newDebtThisMonth;
    if (totalExpVsNewDebt > 0) {
      const newDvEPieData = [];
      const newDvEPieLegend = [];

      if (income > 0) {
        const perc = ((income / totalExpVsNewDebt) * 100).toFixed(0);
        newDvEPieData.push({ value: income, color: '#10b981', text: `${perc}%` });
        newDvEPieLegend.push({ name: 'Ingresos', color: '#10b981', percentage: perc });
      }
      if (expense > 0) {
        const perc = ((expense / totalExpVsNewDebt) * 100).toFixed(0);
        newDvEPieData.push({ value: expense, color: '#ef4444', text: `${perc}%` });
        newDvEPieLegend.push({ name: 'Gastos', color: '#ef4444', percentage: perc });
      }
      if (newDebtThisMonth > 0) {
        const perc = ((newDebtThisMonth / totalExpVsNewDebt) * 100).toFixed(0);
        newDvEPieData.push({ value: newDebtThisMonth, color: '#f59e0b', text: `${perc}%` });
        newDvEPieLegend.push({ name: 'Nueva Deuda', color: '#f59e0b', percentage: perc });
      }

      setDebtVsExpensePieData(newDvEPieData);
      setDebtVsExpensePieLegend(newDvEPieLegend);
    } else {
      setDebtVsExpensePieData([{ value: 100, color: '#e2e8f0', text: '0%' }]);
      setDebtVsExpensePieLegend([]);
    }

    // 7. Formatear Diagrama de Tendencia de Balance (LineChart)
    let currentTrendBalance = 0;
    
    const monthEvents = [];
    rawTransactions.forEach(tx => {
      const txDate = new Date(tx.date || tx.created_at);
      if (txDate.getMonth() === targetMonth && txDate.getFullYear() === targetYear) {
        monthEvents.push({ date: txDate, amount: Number(tx.amount), type: tx.type === 'income' ? 1 : -1 });
      }
    });

    rawDebtPayments.forEach(dp => {
      const dpDate = new Date(dp.created_at);
      if (dpDate.getMonth() === targetMonth && dpDate.getFullYear() === targetYear) {
        monthEvents.push({ date: dpDate, amount: Number(dp.amount), type: -1 });
      }
    });

    monthEvents.sort((a, b) => a.date - b.date);

    const dailyBalances = {};
    monthEvents.forEach(evt => {
      const day = evt.date.getDate().toString();
      if (!dailyBalances[day]) dailyBalances[day] = 0;
      dailyBalances[day] += (evt.amount * evt.type);
    });

    const trendDataPoints = [{ value: 0, label: '1' }];
    const activeDays = Object.keys(dailyBalances).map(Number).sort((a, b) => a - b);
    
    activeDays.forEach(day => {
      currentTrendBalance += dailyBalances[day];
      // Si el día 1 ya tuvo movimientos, lo sobreescribimos para evitar duplicados del día 1
      if (day === 1) {
        trendDataPoints[0] = { value: currentTrendBalance, label: '1' };
      } else {
        trendDataPoints.push({ value: currentTrendBalance, label: day.toString() });
      }
    });

    const finalTrendData = trendDataPoints.map(pt => ({
       ...pt,
       hideDataPoint: trendDataPoints.length > 15,
       labelTextStyle: { color: '#94a3b8', fontSize: 10 }
    }));

    setBalanceTrendData(finalTrendData);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  const formatNumberInput = (value) => {
    if (value === undefined || value === null) return '';
    let cleaned = value.toString().replace(/[^0-9,]/g, '');
    if (cleaned.includes(',')) {
      const parts = cleaned.split(',');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      return parts.slice(0, 2).join(',');
    }
    return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const formatAmountForState = (value) => {
    if (value === undefined || value === null) return '';
    const parts = value.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return parts.join(',');
  };

  const parseFormattedNumber = (value) => {
    if (!value) return 0;
    return parseFloat(value.toString().replace(/\./g, '').replace(',', '.'));
  };

  const handleSaveTransaction = async () => {
    const parsedAmount = parseFormattedNumber(amount);
    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) return Alert.alert("Error", "Ingresa un monto válido mayor a 0");
    if (!selectedCategoryId && !showNewCategoryInput) return Alert.alert("Error", "Selecciona una categoría");
    if (showNewCategoryInput && !newCategoryName.trim()) return Alert.alert("Error", "Escribe el nombre de la nueva categoría");

    try {
      let finalCategoryId = selectedCategoryId;
      if (showNewCategoryInput) {
        const newCat = await financeService.createCategory(userId, newCategoryName.trim(), transactionType);
        finalCategoryId = newCat.id;
      }
      // Se guarda con la fecha actual, por lo que impactará el mes seleccionado si es el mes actual
      await financeService.createTransaction(userId, finalCategoryId, parsedAmount, transactionType, description);
      
      Alert.alert("Éxito", "Registro guardado");
      setShowTransactionModal(false);
      resetTransactionForm();
      fetchRealData(userId);
    } catch (err) {
      Alert.alert("Error", "No se pudo guardar la transacción");
      console.log(err);
    }
  };

  const resetTransactionForm = () => {
    setAmount('');
    setDescription('');
    setSelectedCategoryId(null);
    setNewCategoryName('');
    setShowNewCategoryInput(false);
  };

  const handleSaveDebt = async () => {
    const parsedTotal = parseFormattedNumber(debtTotal);
    if (!debtName.trim() || !parsedTotal || isNaN(parsedTotal) || parsedTotal <= 0) {
      return Alert.alert("Error", "Ingresa un nombre y monto válido");
    }

    try {
      await financeService.createDebt(userId, debtName.trim(), parsedTotal, debtDueDate || null);
      Alert.alert("Éxito", "Deuda registrada");
      setShowDebtModal(false);
      setDebtName('');
      setDebtTotal('');
      setDebtDueDate('');
      fetchRealData(userId);
    } catch (err) {
      Alert.alert("Error", "No se pudo guardar la deuda");
    }
  };

  const handlePayDebt = async () => {
    const parsedAmount = parseFormattedNumber(payAmount);
    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) return Alert.alert("Error", "Monto inválido");
    
    const remainingAmount = selectedDebt.total_amount - selectedDebt.paid_amount;

    if (parsedAmount > remainingAmount) {
      return Alert.alert("Monto Excedido", `No puedes abonar más del saldo restante ($${formatNumberInput(remainingAmount)}).`);
    }

    try {
      await financeService.payDebt(userId, selectedDebt.id, parsedAmount, selectedDebt.paid_amount);

      Alert.alert("Éxito", "Pago registrado");
      setShowPayModal(false);
      setPayAmount('');
      setSelectedDebt(null);
      fetchRealData(userId);
    } catch (err) {
      Alert.alert("Error", "No se pudo registrar el pago. Revisa si el monto es muy grande para la base de datos.");
    }
  };

  const openTransactionModal = (type) => {
    resetTransactionForm();
    setTransactionType(type);
    setShowTransactionModal(true);
  };

  const openPayModal = (debt) => {
    setSelectedDebt(debt);
    setPayAmount('');
    setShowPayModal(true);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  const filteredCategories = categories.filter(c => c.type === transactionType);

  const formatLabelValue = (val) => {
    const numVal = Number(val);
    if (isNaN(numVal)) return String(val);
    const sign = numVal < 0 ? '-' : '';
    const absVal = Math.abs(numVal);

    if (isLargeScreen) return sign + '$' + formatNumberInput(absVal.toFixed(0));
    if (absVal >= 1000000) return sign + '$' + (absVal / 1000000).toFixed(1) + 'M';
    if (absVal >= 1000) return sign + '$' + (absVal / 1000).toFixed(1) + 'k';
    return sign + '$' + formatNumberInput(absVal.toFixed(0));
  };

  const expectedCash = totalIncome - totalExpense - totalPaidDebt;
  
  // Calcular espaciado dinámico para la gráfica de línea
  const chartAvailableWidth = width - 140; // Ancho pantalla menos paddings y eje Y
  const dynamicSpacing = Math.max(chartAvailableWidth / Math.max(balanceTrendData.length - 1, 1), 10);
  const barData = [
    { 
      value: totalIncome, 
      label: 'Ingresos', 
      frontColor: '#10b981',
      topLabelComponent: () => <Text style={{color: '#10b981', fontSize: isLargeScreen ? 12 : 10, marginBottom: 4, fontWeight: '700'}}>{formatLabelValue(totalIncome)}</Text>
    },
    { 
      value: totalExpense, 
      label: 'Gastos', 
      frontColor: '#ef4444',
      topLabelComponent: () => <Text style={{color: '#ef4444', fontSize: isLargeScreen ? 12 : 10, marginBottom: 4, fontWeight: '700'}}>{formatLabelValue(totalExpense)}</Text>
    },
    { 
      value: totalPaidDebt, 
      label: 'D. Pag.', 
      frontColor: '#3b82f6',
      topLabelComponent: () => <Text style={{color: '#3b82f6', fontSize: isLargeScreen ? 12 : 10, marginBottom: 4, fontWeight: '700'}}>{formatLabelValue(totalPaidDebt)}</Text>
    },
    { 
      value: totalPendingDebt, 
      label: 'D. Pend.', 
      frontColor: '#f59e0b',
      topLabelComponent: () => <Text style={{color: '#f59e0b', fontSize: isLargeScreen ? 12 : 10, marginBottom: 4, fontWeight: '700'}}>{formatLabelValue(totalPendingDebt)}</Text>
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.title}>Mis Finanzas</Text>
          <TouchableOpacity style={styles.settingsBtn}>
            <Ionicons name="options-outline" size={24} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* Month Selector */}
        <View style={styles.monthSelectorRow}>
          <TouchableOpacity onPress={handlePrevMonth} style={styles.monthArrow}>
            <Ionicons name="chevron-back" size={24} color="#475569" />
          </TouchableOpacity>
          <Text style={styles.monthText}>
            {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}
          </Text>
          <TouchableOpacity onPress={handleNextMonth} style={styles.monthArrow}>
            <Ionicons name="chevron-forward" size={24} color="#475569" />
          </TouchableOpacity>
        </View>

        {/* Tarjeta de Balance Principal */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceTop}>
            <View style={{flex: 1}}>
              <Text style={styles.balanceLabel}>Balance de Movimientos</Text>
              <Text style={[styles.balanceAmount, {fontSize: 32, marginBottom: 0}]} numberOfLines={1} adjustsFontSizeToFit>${formatNumberInput(balance.toFixed(0))}</Text>
            </View>
            <View style={styles.trendBadge}>
              <Ionicons name={balance >= 0 ? "trending-up" : "trending-down"} size={14} color={balance >= 0 ? "#10b981" : "#ef4444"} />
              <Text style={[styles.trendText, {color: balance >= 0 ? "#10b981" : "#ef4444"}]}>{balance >= 0 ? 'Positivo' : 'Negativo'}</Text>
            </View>
          </View>
          
          {/* Gráfico de Tendencia (Mini Barras) */}
          <View style={{ marginTop: 16, marginBottom: 16, height: 120 }}>
            {balanceTrendData.length > 1 ? (
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', flex: 1, gap: 2, paddingHorizontal: 4 }}>
                  {(() => {
                    const vals = balanceTrendData.map(d => d.value);
                    const maxAbs = Math.max(...vals.map(Math.abs), 1);
                    return balanceTrendData.map((pt, idx) => {
                      const heightPercent = Math.abs(pt.value) / maxAbs * 100;
                      const isPositive = pt.value >= 0;
                      return (
                        <View key={idx} style={{ flex: 1, height: '100%', justifyContent: 'flex-end' }}>
                          <View style={{
                            height: `${Math.max(heightPercent, 3)}%`,
                            backgroundColor: isPositive ? '#10b981' : '#ef4444',
                            borderTopLeftRadius: 3,
                            borderTopRightRadius: 3,
                            minHeight: 3,
                            opacity: 0.5 + (idx / balanceTrendData.length) * 0.5,
                          }} />
                        </View>
                      );
                    });
                  })()}
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, paddingHorizontal: 4 }}>
                  <Text style={{ fontSize: 10, color: '#94a3b8' }}>Día {balanceTrendData[0]?.label}</Text>
                  <Text style={{ fontSize: 10, color: '#94a3b8' }}>Día {balanceTrendData[balanceTrendData.length - 1]?.label}</Text>
                </View>
              </View>
            ) : (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: '#94a3b8', fontSize: 13 }}>Sin movimientos este mes</Text>
              </View>
            )}
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <View style={styles.statIconIncome}><Ionicons name="arrow-down" size={16} color="#10b981" /></View>
              <View><Text style={styles.statLabel}>Ingresos</Text><Text style={styles.statValue}>${formatNumberInput(totalIncome.toFixed(0))}</Text></View>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <View style={styles.statIconExpense}><Ionicons name="arrow-up" size={16} color="#ef4444" /></View>
              <View><Text style={styles.statLabel}>Gastos</Text><Text style={styles.statValue}>${formatNumberInput(totalExpense.toFixed(0))}</Text></View>
            </View>
          </View>
        </View>

        {/* Indicadores Avanzados */}
        <View style={[styles.indicatorsRow, !isLargeScreen && { flexDirection: 'column' }]}>
          <View style={styles.indicatorBox}>
            <Text style={styles.indicatorLabel} numberOfLines={1} adjustsFontSizeToFit>Flujo Neto (Mes)</Text>
            <Text style={[styles.indicatorValue, {color: expectedCash >= 0 ? '#10b981' : '#ef4444'}]}>
              ${formatNumberInput(expectedCash.toFixed(0))}
            </Text>
            <Text style={styles.indicatorSubText}>Ingresos - Salidas</Text>
          </View>
          <View style={styles.indicatorBox}>
            <Text style={styles.indicatorLabel}>Deuda Pendiente</Text>
            <Text style={[styles.indicatorValue, {color: '#f59e0b'}]}>
              ${formatNumberInput(totalPendingDebt.toFixed(0))}
            </Text>
            <Text style={styles.indicatorSubText}>Corte del mes</Text>
          </View>
        </View>

        {/* Acciones Rápidas */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnIncome]} activeOpacity={0.8} onPress={() => openTransactionModal('income')}>
            <Ionicons name="add-circle" size={20} color="#ffffff" />
            <Text style={styles.actionBtnText}>Nuevo Ingreso</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnExpense]} activeOpacity={0.8} onPress={() => openTransactionModal('expense')}>
            <Ionicons name="remove-circle" size={20} color="#ffffff" />
            <Text style={styles.actionBtnText}>Nuevo Gasto</Text>
          </TouchableOpacity>
        </View>

        {/* CONTENEDOR DE GRÁFICOS (Responsivo) */}
        <View style={isLargeScreen ? styles.chartsRowContainer : {}}>

          {/* Balance General (Barras Horizontales Custom) */}
          <View style={[styles.chartCard, isLargeScreen && { width: '58%' }]}>
            <Text style={styles.chartTitle}>Comparativa del Mes</Text>
            <View style={{ width: '100%', marginTop: 12 }}>
              {(() => {
                const items = [
                  { label: 'Ingresos', value: totalIncome, color: '#10b981' },
                  { label: 'Gastos', value: totalExpense, color: '#ef4444' },
                  { label: 'Deuda Pagada', value: totalPaidDebt, color: '#3b82f6' },
                  { label: 'Deuda Pendiente', value: totalPendingDebt, color: '#f59e0b' },
                ];
                const maxVal = Math.max(...items.map(i => i.value), 1);
                return items.map((item, idx) => (
                  <View key={idx} style={{ marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#334155' }}>{item.label}</Text>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: item.color }}>${formatNumberInput(item.value.toFixed(0))}</Text>
                    </View>
                    <View style={{ height: 28, backgroundColor: '#f1f5f9', borderRadius: 14, overflow: 'hidden' }}>
                      <View style={{
                        height: '100%',
                        width: `${Math.max((item.value / maxVal) * 100, 2)}%`,
                        backgroundColor: item.color,
                        borderRadius: 14,
                        justifyContent: 'center',
                        paddingLeft: 12,
                      }}>
                        {item.value > 0 && (
                          <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '700' }}>
                            {((item.value / maxVal) * 100).toFixed(0)}%
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                ));
              })()}
            </View>
          </View>

          {/* Ingresos vs Gastos vs Deuda Adquirida */}
          <View style={[styles.chartCard, isLargeScreen && { width: '38%' }]}>
            <Text style={styles.chartTitle}>Flujo de Capital</Text>
            <Text style={styles.chartSubTitle}>(Ingresos, Gastos y Nueva Deuda)</Text>
            <View style={styles.chartWrapper}>
              <PieChart
                data={debtVsExpensePieData}
                donut
                showText
                textColor="white"
                radius={80}
                innerRadius={50}
                textSize={12}
              />
            </View>
            <View style={styles.chartLegend}>
              {debtVsExpensePieLegend.map((leg, idx) => (
                <View key={idx} style={styles.legendItem}>
                  <View style={[styles.legendDot, {backgroundColor: leg.color}]}/>
                  <Text style={styles.legendText}>{leg.name} ({leg.percentage}%)</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Distribución de Ingresos */}
          <View style={[styles.chartCard, isLargeScreen && styles.halfChartCard]}>
            <Text style={styles.chartTitle}>Fuentes de Ingresos</Text>
            <Text style={styles.chartSubTitle}>(Dinero entrante del mes)</Text>
            <View style={styles.chartWrapper}>
              <PieChart
                data={incomePieData}
                donut
                showText
                textColor="white"
                radius={80}
                innerRadius={50}
                textSize={12}
              />
            </View>
            <View style={styles.chartLegend}>
              {incomePieLegend.map((leg, idx) => (
                <View key={idx} style={styles.legendItem}>
                  <View style={[styles.legendDot, {backgroundColor: leg.color}]}/>
                  <Text style={styles.legendText}>{leg.name} ({leg.percentage}%)</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Distribución de Salidas */}
          <View style={[styles.chartCard, isLargeScreen && styles.halfChartCard]}>
            <Text style={styles.chartTitle}>Distribución de Salidas</Text>
            <Text style={styles.chartSubTitle}>(Gastos + Pagos de Deuda del mes)</Text>
            <View style={styles.chartWrapper}>
              <PieChart
                data={pieData}
                donut
                showText
                textColor="white"
                radius={80}
                innerRadius={50}
                textSize={12}
              />
            </View>
            <View style={styles.chartLegend}>
              {pieLegend.map((leg, idx) => (
                <View key={idx} style={styles.legendItem}>
                  <View style={[styles.legendDot, {backgroundColor: leg.color}]}/>
                  <Text style={styles.legendText}>{leg.name} ({leg.percentage}%)</Text>
                </View>
              ))}
            </View>
          </View>

        </View>

        {/* Deudas */}
        <View style={styles.transactionsHeader}>
          <Text style={styles.transactionsTitle}>Mis Deudas ({currentMonth.toLocaleDateString('es-ES', { month: 'long' }).replace(/^\w/, c => c.toUpperCase())})</Text>
          <TouchableOpacity onPress={() => setShowDebtModal(true)}>
            <Text style={styles.seeAllText}>+ Añadir</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.transactionsList}>
          {visibleDebts.length === 0 ? (
            <Text style={{color: '#94a3b8', textAlign: 'center', marginVertical: 10}}>No hay deudas activas en este mes.</Text>
          ) : (
            visibleDebts.map((debt, index) => {
              const progress = Math.min((debt.paid_amount / debt.total_amount) * 100, 100);
              const isPaid = progress >= 100 || debt.is_paid;
              return (
                <View key={index} style={[styles.debtItem, isPaid && {opacity: 0.5}]}>
                  <View style={styles.debtInfo}>
                    <Text style={[styles.debtTitle, isPaid && {textDecorationLine: 'line-through'}]}>{debt.name}</Text>
                    <Text style={styles.debtStatus}>${formatNumberInput(debt.paid_amount)} pagado de ${formatNumberInput(debt.total_amount)}</Text>
                    <View style={styles.progressBarBg}><View style={[styles.progressBarFill, {width: `${progress}%`, backgroundColor: isPaid ? '#10b981' : '#ef4444'}]} /></View>
                  </View>
                  {!isPaid && (
                    <TouchableOpacity style={styles.payBtn} onPress={() => openPayModal(debt)}>
                      <Text style={styles.payBtnText}>Abonar</Text>
                    </TouchableOpacity>
                  )}
                  {isPaid && <Ionicons name="checkmark-circle" size={24} color="#10b981" />}
                </View>
              )
            })
          )}
        </View>
      </ScrollView>

      {/* Modal Agregar Transacción */}
      <Modal visible={showTransactionModal} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{transactionType === 'income' ? 'Registrar Ingreso' : 'Registrar Gasto'}</Text>
              <TouchableOpacity onPress={() => setShowTransactionModal(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Monto</Text>
              <TextInput 
                style={styles.input} 
                keyboardType="numeric" 
                placeholder="0" 
                value={amount} 
                onChangeText={(text) => setAmount(formatNumberInput(text))} 
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Categoría</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                {filteredCategories.map(cat => (
                  <TouchableOpacity 
                    key={cat.id} 
                    style={[styles.categoryChip, selectedCategoryId === cat.id && styles.categoryChipSelected, showNewCategoryInput && {opacity: 0.5}]}
                    onPress={() => {
                      setSelectedCategoryId(cat.id);
                      setShowNewCategoryInput(false);
                    }}
                  >
                    <Text style={[styles.categoryChipText, selectedCategoryId === cat.id && styles.categoryChipTextSelected]}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity 
                  style={[styles.categoryChip, showNewCategoryInput && styles.categoryChipSelected]}
                  onPress={() => {
                    setShowNewCategoryInput(true);
                    setSelectedCategoryId(null);
                  }}
                >
                  <Text style={[styles.categoryChipText, showNewCategoryInput && styles.categoryChipTextSelected]}>+ Nueva</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {showNewCategoryInput && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nombre de la nueva categoría</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="Ej. Transporte, Mascota..." 
                  value={newCategoryName} 
                  onChangeText={setNewCategoryName} 
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Descripción (opcional)</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Ej. Almuerzo..." 
                value={description} 
                onChangeText={setDescription} 
              />
            </View>

            <TouchableOpacity style={[styles.saveBtn, {backgroundColor: transactionType === 'income' ? '#10b981' : '#ef4444'}]} onPress={handleSaveTransaction}>
              <Text style={styles.saveBtnText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal Agregar Deuda */}
      <Modal visible={showDebtModal} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Añadir Deuda</Text>
              <TouchableOpacity onPress={() => setShowDebtModal(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombre de la Deuda</Text>
              <TextInput style={styles.input} placeholder="Ej. Tarjeta de Crédito" value={debtName} onChangeText={setDebtName} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Monto Total a Pagar</Text>
              <TextInput style={styles.input} keyboardType="numeric" placeholder="0" value={debtTotal} onChangeText={(text) => setDebtTotal(formatNumberInput(text))} />
            </View>
            <TouchableOpacity style={[styles.saveBtn, {backgroundColor: '#3b82f6'}]} onPress={handleSaveDebt}>
              <Text style={styles.saveBtnText}>Guardar Deuda</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal Abonar a Deuda */}
      <Modal visible={showPayModal} animationType="fade" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlayCentered}>
          <View style={styles.modalContentCentered}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Abonar a: {selectedDebt?.name}</Text>
              <TouchableOpacity onPress={() => setShowPayModal(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <Text style={{color: '#64748b', marginBottom: 16}}>Restante: ${formatNumberInput((selectedDebt?.total_amount - selectedDebt?.paid_amount) || 0)}</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Monto a Abonar</Text>
              <TextInput style={styles.input} keyboardType="numeric" placeholder="0" value={payAmount} onChangeText={(text) => setPayAmount(formatNumberInput(text))} />
            </View>
            
            <TouchableOpacity style={[styles.saveBtn, {backgroundColor: '#10b981'}]} onPress={handlePayDebt}>
              <Text style={styles.saveBtnText}>Registrar Pago</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.saveBtn, {backgroundColor: '#f1f5f9', marginTop: 12}]} 
              onPress={() => {
                const remaining = selectedDebt?.total_amount - selectedDebt?.paid_amount;
                setPayAmount(formatAmountForState(remaining));
              }}>
              <Text style={[styles.saveBtnText, {color: '#0f172a'}]}>
                Pagar Totalidad (${formatNumberInput((selectedDebt?.total_amount - selectedDebt?.paid_amount) || 0)})
              </Text>
            </TouchableOpacity>

          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: Platform.OS === 'android' ? 10 : 0 },
  title: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
  settingsBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  
  monthSelectorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24, backgroundColor: '#ffffff', paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  monthArrow: { paddingHorizontal: 16 },
  monthText: { fontSize: 18, fontWeight: '700', color: '#0f172a', minWidth: 140, textAlign: 'center' },

  balanceCard: { backgroundColor: '#ffffff', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 4, marginBottom: 16 },
  balanceTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  balanceLabel: { color: '#64748b', fontSize: 15, fontWeight: '500' },
  trendBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  trendText: { fontWeight: '700', fontSize: 13 },
  balanceAmount: { fontSize: 42, fontWeight: '900', color: '#0f172a', marginBottom: 24, letterSpacing: -1 },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 20, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  statBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  statIconIncome: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(16, 185, 129, 0.1)', justifyContent: 'center', alignItems: 'center' },
  statIconExpense: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(239, 68, 68, 0.1)', justifyContent: 'center', alignItems: 'center' },
  statLabel: { fontSize: 13, color: '#64748b', marginBottom: 2 },
  statValue: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  statDivider: { width: 1, height: 30, backgroundColor: '#e2e8f0', marginHorizontal: 16 },

  indicatorsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  indicatorBox: { flex: 1, backgroundColor: '#ffffff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  indicatorLabel: { fontSize: 13, color: '#64748b', fontWeight: '500', marginBottom: 6 },
  indicatorValue: { fontSize: 20, fontWeight: '800' },
  indicatorSubText: { fontSize: 11, color: '#94a3b8', marginTop: 4 },

  actionsRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  actionBtn: { flex: 1, flexDirection: 'row', height: 54, borderRadius: 16, justifyContent: 'center', alignItems: 'center', gap: 8, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
  actionBtnIncome: { backgroundColor: '#10b981', shadowColor: '#10b981' },
  actionBtnExpense: { backgroundColor: '#ef4444', shadowColor: '#ef4444' },
  actionBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 16 },

  chartsRowContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },

  chartCard: { backgroundColor: '#ffffff', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 24, alignItems: 'center', width: '100%' },
  halfChartCard: { width: '48%' },

  chartTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 4, alignSelf: 'flex-start' },
  chartSubTitle: { fontSize: 13, color: '#64748b', marginBottom: 20, alignSelf: 'flex-start' },
  chartWrapper: { alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  barChartWrapper: { alignItems: 'center', justifyContent: 'center', marginTop: 10, width: '100%' },
  chartLegend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 13, color: '#475569' },

  transactionsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 },
  transactionsTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  seeAllText: { color: '#3b82f6', fontWeight: '600', fontSize: 14 },
  transactionsList: { backgroundColor: '#ffffff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  debtItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  debtInfo: { flex: 1, marginRight: 16 },
  debtTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 4 },
  debtStatus: { fontSize: 13, color: '#64748b', marginBottom: 8 },
  progressBarBg: { height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#ef4444', borderRadius: 3 },
  payBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  payBtnText: { color: '#0f172a', fontWeight: '600', fontSize: 14 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  modalOverlayCentered: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContentCentered: { backgroundColor: '#ffffff', borderRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 14, color: '#64748b', marginBottom: 8, fontWeight: '500' },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 16, fontSize: 16, color: '#0f172a' },
  saveBtn: { paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  
  categoryScroll: { flexDirection: 'row', paddingBottom: 8 },
  categoryChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#f1f5f9', marginRight: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  categoryChipSelected: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  categoryChipText: { color: '#64748b', fontWeight: '600', fontSize: 14 },
  categoryChipTextSelected: { color: '#ffffff' },
});
