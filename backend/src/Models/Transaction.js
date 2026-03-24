class Transaction {
  #id;
  #type;
  #amount;
  #description;
  #category;
  #txDate;
  #createdBy;
  #createdAt;

  constructor({
    id,
    type,
    amount,
    description,
    category,
    tx_date,
    created_by,
    created_at,
  }) {
    this.#id = id;
    this.#type = type;
    this.#amount = Number(amount);
    this.#description = description;
    this.#category = category;
    this.#txDate = tx_date;
    this.#createdBy = created_by;
    this.#createdAt = created_at || null;
  }

  get id() {
    return this.#id;
  }

  get type() {
    return this.#type;
  }

  get amount() {
    return this.#amount;
  }

  get description() {
    return this.#description;
  }

  get category() {
    return this.#category;
  }

  get txDate() {
    return this.#txDate;
  }

  get createdBy() {
    return this.#createdBy;
  }

  toJSON() {
    return {
      id: this.#id,
      type: this.#type,
      amount: this.#amount,
      description: this.#description,
      category: this.#category,
      tx_date: this.#txDate,
      created_by: this.#createdBy,
      created_at: this.#createdAt,
    };
  }
}

module.exports = Transaction;