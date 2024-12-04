const express = require('express');
const bodyParser = require('body-parser');
const cron = require('node-cron');

// Initialize Express
const app = express();
app.use(bodyParser.json());

// In-memory data storage (use an array for expenses)
let expenses = [];

// Predefined categories
const categories = ['Food', 'Travel', 'Utilities', 'Entertainment', 'Health'];

// Utility function to generate summaries
const generateSummary = () => {
  const summary = {
    totalAmount: 0,
    byCategory: {}
  };

  expenses.forEach(expense => {
    summary.totalAmount += expense.amount;

    if (!summary.byCategory[expense.category]) {
      summary.byCategory[expense.category] = 0;
    }

    summary.byCategory[expense.category] += expense.amount;
  });

  return summary;
};

// Endpoint to add a new expense
app.post('/expenses', (req, res) => {
  const { category, amount, date } = req.body;

  // Validate expense data
  if (!category || !amount || !date) {
    return res.status(400).json({ status: 'error', error: 'Missing required fields' });
  }

  if (!categories.includes(category)) {
    return res.status(400).json({ status: 'error', error: 'Invalid category' });
  }

  if (amount <= 0) {
    return res.status(400).json({ status: 'error', error: 'Amount must be a positive number' });
  }

  // Add expense to the array
  expenses.push({ category, amount, date });
  return res.status(200).json({ status: 'success', data: { category, amount, date } });
});

// Endpoint to retrieve expenses with optional filters
app.get('/expenses', (req, res) => {
  const { category, startDate, endDate } = req.query;
  let filteredExpenses = [...expenses];

  // Filter by category
  if (category) {
    if (!categories.includes(category)) {
      return res.status(400).json({ status: 'error', error: 'Invalid category' });
    }
    filteredExpenses = filteredExpenses.filter(expense => expense.category === category);
  }

  // Filter by date range
  if (startDate && endDate) {
    filteredExpenses = filteredExpenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= new Date(startDate) && expenseDate <= new Date(endDate);
    });
  }

  return res.status(200).json({ status: 'success', data: filteredExpenses });
});

// Endpoint to analyze spending by category and time
app.get('/expenses/analysis', (req, res) => {
  const summary = generateSummary();
  return res.status(200).json({ status: 'success', data: summary });
});

// Automated task to generate a weekly summary report
cron.schedule('0 0 * * 0', () => {
  const weeklySummary = generateSummary();
  console.log('Weekly Expense Summary:', weeklySummary);
});

// Automated task to generate a monthly summary report
cron.schedule('0 0 1 * *', () => {
  const monthlySummary = generateSummary();
  console.log('Monthly Expense Summary:', monthlySummary);
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Expense Tracker API running on port ${port}`);
});
