"use strict";
const db = require("../db");
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../config");
const { BadRequestError } = require("../expressError");
/** User of the site. */

class User {

  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    const hashedPassword = await bcrypt.hash(
      password, BCRYPT_WORK_FACTOR);

    const result = await db.query(
      `INSERT INTO users (username,
        password,
        first_name,
        last_name,
        phone,
        join_at,
        last_login_at)
      VALUES
      ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
      RETURNING username, password, first_name, last_name, phone`,
      [username, hashedPassword, first_name, last_name, phone]
    )
    return result.rows[0];
  }

  /** Authenticate: is username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const result = await db.query(
      `SELECT username, password
        FROM users
        WHERE username = $1`,
        [username]
    )

    const user = result.rows[0];
    if (user === undefined) throw new BadRequestError(`Could not find ${username}`);

    if (await bcrypt.compare(password, user.password) === true) {
      return true;
    } else {
      return false;
    }
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    try{
      await db.query(
        `UPDATE users
          SET last_login_at = current_timestamp
          WHERE username = $1`,
          [username]
      )
    } catch(err){
      throw new BadRequestError(`Could not find ${username}`);
    }

  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
    const result = await db.query(
      `SELECT username, first_name, last_name
        FROM users`
    )

    return result.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const result = await db.query(
      `SELECT username, first_name, last_name, phone, join_at, last_login_at
        FROM users
        WHERE username = $1`,
        [username]
    )

    const user = result.rows[0]
    if (user === undefined) throw new BadRequestError(`Could not find ${username}`);

    return user;

  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const result = await db.query(
    //   `SELECT id, body, sent_at, read_at,
    //     (users.username, first_name, last_name, phone) AS to_user
    //     FROM users
    //     JOIN messages ON messages.from_username = $1`,
    //     [username]
    // );
    //FIXME: Does this ^ work? Maybe! Probably not
    // Otherwise query messages and then loop through and query user data

    return result.rows;

  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
  }
}


module.exports = User;
