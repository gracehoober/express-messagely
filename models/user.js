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
      password,
      BCRYPT_WORK_FACTOR
    );

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
    //FIXME: This error should be UnauthorizedError, for security
    if (user === undefined) throw new BadRequestError(`Could not find ${username}`);

    //TODO: Can just return this boolean:
    if (await bcrypt.compare(password, user.password) === true) {
      return true;
    } else {
      return false;
    }
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    try {
      await db.query(
        `UPDATE users
          SET last_login_at = current_timestamp
          WHERE username = $1`, //FIXME: put RETURNING statement, and handle error based on that
        [username]
      );
    } catch (err) {
      throw new BadRequestError(`Could not find ${username}`); //TODO: NotFound()
    }

  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
    const result = await db.query(
      `SELECT username, first_name, last_name
        FROM users` //TODO: ORDER BY
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
    User.checkUser(username);

    const result = await db.query(
      `SELECT id, body, sent_at, read_at, to_username AS to_user
        FROM users
        JOIN messages
        ON messages.from_username = $1
        WHERE username = $1`,
      [username]
    );

    const messages = result.rows;
    for (const m of messages) {

      const toUserData = await db.query(
        `SELECT users.username, first_name, last_name, phone
          FROM users
          WHERE username = $1`,
        [m.to_user]
      );

      m.to_user = toUserData.rows[0];
      console.log("!!!MESSAGE:", m);
    }

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
    User.checkUser(username);

    const result = await db.query(
      `SELECT id, body, sent_at, read_at, from_username AS from_user
        FROM users
        JOIN messages
        ON messages.to_username = $1
        WHERE username = $1`,
      [username]
    );

    const messages = result.rows;
    for (const m of messages) {

      const fromUserData = await db.query(
        `SELECT users.username, first_name, last_name, phone
          FROM users
          WHERE username = $1`,
        [m.from_user]
      );

      m.from_user = fromUserData.rows[0];
      console.log("!!!MESSAGE:", m);
    }

    return messages;
  }

  /** Checks that a username exists in database, throws error if not found */
  static async checkUser(username) {
    const result = await db.query(
      `SELECT username
        FROM users
        WHERE username = $1`,
      [username]
    );

    if (result.rows[0] === undefined) {
      throw new BadRequestError(`Could not find ${username}`);
    }
  }

}


module.exports = User;
