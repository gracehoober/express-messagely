"use strict";
const db = require("../db");
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../config");
const { BadRequestError, NotFoundError, UnauthorizedError } = require("../expressError");
const bodyParser = require("body-parser");
/** User of the site. */

class User {

  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    const hashedPassword = await bcrypt.hash(
      password,
      BCRYPT_WORK_FACTOR
    );

    const result = await db.query(
      `INSERT INTO users (username,
        password,
        first_name,
        last_name,
        phone,
        join_at
        )
      VALUES
      ($1, $2, $3, $4, $5, current_timestamp)
      RETURNING username, password, first_name, last_name, phone`,
      [username, hashedPassword, first_name, last_name, phone]
    );
    return result.rows[0];
  }

  /** Authenticate: is username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const result = await db.query(
      `SELECT username, password
        FROM users
        WHERE username = $1`,
      [username]
    );

    const user = result.rows[0];
    if (!user) return false;
    return await bcrypt.compare(password, user.password) === true;
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {

    let result = await db.query(
      `UPDATE users
          SET last_login_at = current_timestamp
          WHERE username = $1
          RETURNING username`,
      [username]
    );

    if (result.rows[0] === undefined) {
      throw new NotFoundError(`Could not find ${username}`);
    }
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
    const result = await db.query(
      `SELECT username, first_name, last_name
        FROM users
        ORDER BY username`
    );

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
    );

    const user = result.rows[0];
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
      `SELECT id, body, sent_at, read_at, to_username,first_name, last_name, phone
        FROM messages
        JOIN users
        ON messages.to_username = username
        WHERE messages.from_username = $1`,
      [username]
    );

    const messages = result.rows.map(m => {
      return {
        id: m.id,
        to_user: {
          username: m.to_username,
          first_name: m.first_name,
          last_name: m.last_name,
          phone: m.phone
        },
        body: m.body,
        sent_at: m.sent_at,
        read_at: m.read_at
      };
    });

    return messages;
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {

    const result = await db.query(
      `SELECT id, body, sent_at, read_at, from_username, first_name, last_name, phone
        FROM messages
        JOIN users
        ON messages.from_username = username
        WHERE messages.to_username = $1`,
      [username]
    );

    const messages = result.rows.map(m => {
      return {
        id: m.id,
        from_user: {
          username: m.from_username,
          first_name: m.first_name,
          last_name: m.last_name,
          phone: m.phone
        },
        body: m.body,
        sent_at: m.sent_at,
        read_at: m.read_at
      };
    });

    return messages;
  }

  /** Checks that a username exists in database, throws error if not found */
  // static async checkUser(username) {
  //   const result = await db.query(
  //     `SELECT username
  //       FROM users
  //       WHERE username = $1`,
  //     [username]
  //   );

  //   if (result.rows[0] === undefined) {
  //     throw new BadRequestError(`Could not find ${username}`);
  //   }
  // }

}


module.exports = User;
