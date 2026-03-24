class User {
  #id;
  #fullName;
  #email;
  #role;
  #isActive;

  constructor({ id, full_name, email, role, is_active }) {
    this.#id = id;
    this.#fullName = full_name;
    this.#email = email;
    this.#role = role;
    this.#isActive = is_active;
  }

  get id() {
    return this.#id;
  }

  get fullName() {
    return this.#fullName;
  }

  get email() {
    return this.#email;
  }

  get role() {
    return this.#role;
  }

  get isActive() {
    return this.#isActive;
  }

  toJSON() {
    return {
      id: this.#id,
      full_name: this.#fullName,
      email: this.#email,
      role: this.#role,
      is_active: this.#isActive,
    };
  }
}

module.exports = User;