const { request } = require("express");
const express = require("express");
const { v4: uuidv4 } = require("uuid");
const app = express();

const customers = [];

app.use(express.json());

/*
- Cpf: string
- Name:string
- id: uuid (identificador unico universal)
- statement [] (extrato - lançamentos)
*/

const verifyIfExistsAccountCPF = function (req, res, next) {
  const { cpf } = req.headers;

  const customer = customers.find((customer) => customer.cpf === cpf);

  if (!customer) {
    return res.status(400).json({ error: "Customer not found" });
  }
  request.customer = customer;
  next();
};

function getBalance(statement) {
  const balance = statement.reduce((acumulator, operation) => {
    if (operation.type === "credit") {
      return acumulator + operation.amount;
    } else {
      return acumulator - operation.amount;
    }
  }, 0);
  return balance;
}

app.post("/account", (req, res) => {
  //const cpf = request.body;
  const { cpf, name } = req.body; //desestruturação

  const customersAlreadyExists = customers.some(
    (customer) => customer.cpf === cpf
  );

  if (customersAlreadyExists) {
    return res.status(400).json({ error: "Customer already exists" });
  }

  customers.push({
    cpf,
    name,
    id: uuidv4(),
    statement: [],
  });

  return res.status(201).send();
});

//listar o extrato do cliente
//app.get("/statement/:cpf", (req, res) => {
//const { cpf } = req.params;
app.get("/statement/", verifyIfExistsAccountCPF, (req, res) => {
  const { customer } = request;
  return res.json(customer.statement);
});

app.post("/deposit", verifyIfExistsAccountCPF, (req, res) => {
  const { description, amount } = req.body;

  const { customer } = request;

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: "credit",
  };

  customer.statement.push(statementOperation);

  return res.status(201).send();
});

app.post("/withdraw", verifyIfExistsAccountCPF, (req, res) => {
  const { amount } = req.body;
  const { customer } = request;

  const balance = getBalance(customer.statement);

  if (balance < amount) {
    return res.status(400).json({ error: "Insufficient funds." });
  }

  const statementOperation = {
    amount,
    created_at: new Date(),
    type: "debit",
  };

  customer.statement.push(statementOperation);

  return res.status(201).send();
});

app.get("/statement/date", verifyIfExistsAccountCPF, (req, res) => {
  const { customer } = request;
  const { date } = req.query;

  const dateFormat = new Date(date + " 00:00");

  const statement = customer.statement.filter(
    (statement) =>
      statement.created_at.toDateString() ===
      new Date(dateFormat).toDateString()
  );

  return res.json(customer.statement);
});

app.put("/account", verifyIfExistsAccountCPF, (req, res) => {
  const { name } = req.body;
  const { customer } = request;

  customer.name = name;

  return res.status(201).send();
});

app.get("/account", verifyIfExistsAccountCPF, (req, res) => {
  const { customer } = req;

  return res.json(customer);
});

app.delete("/account", verifyIfExistsAccountCPF, (req, res) => {
  const { customer } = req;

  //splice
  customers.splice(customer, 1);

  return res.status(200).json(customers);
});

app.get("/balance", verifyIfExistsAccountCPF, (req, res) => {
  const { customer } = req;

  const balance = getBalance(customer.statement);

  return res.json(balance);
});

app.listen(3333);
