class Attendance {
  #id;
  #userId;
  #workDate;
  #checkIn;
  #checkOut;
  #notes;

  constructor({
    id,
    user_id,
    work_date,
    check_in,
    check_out = null,
    notes = null,
  }) {
    this.#id = id;
    this.#userId = user_id;
    this.#workDate = work_date;
    this.#checkIn = check_in ? new Date(check_in) : null;
    this.#checkOut = check_out ? new Date(check_out) : null;
    this.#notes = notes;
  }

  calculateTotalHours() {
    if (!this.#checkIn || !this.#checkOut) return 0;

    const milliseconds = this.#checkOut - this.#checkIn;
    const hours = milliseconds / (1000 * 60 * 60);

    return Number(hours.toFixed(2));
  }

  toJSON() {
    return {
      id: this.#id,
      user_id: this.#userId,
      work_date: this.#workDate,
      check_in: this.#checkIn,
      check_out: this.#checkOut,
      total_hours: this.calculateTotalHours(),
      notes: this.#notes,
    };
  }
}

module.exports = Attendance;