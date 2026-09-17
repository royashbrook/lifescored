import { DurableObject } from 'cloudflare:workers';

// One coordinator is intentional: the product promises one global 200-call daily cap.
export class NarrativeBudget extends DurableObject {
  /** @param {DurableObjectState} ctx @param {Env} env */
  constructor(ctx, env) {
    super(ctx, env);
    this.ctx.storage.sql.exec('create table if not exists quota (key text primary key, day text not null, used integer not null)');
  }

  /** @param {string} day @param {string} ipHash */
  reserve(day, ipHash) {
    return this.ctx.storage.transactionSync(() => {
      const sql = this.ctx.storage.sql;
      const latest = [...sql.exec("select day from quota where key = 'global'")][0]?.day;
      // A delayed request from yesterday must not reset today's allowance.
      if (latest && String(latest) > day) return false;
      sql.exec('delete from quota where day < ?', day);
      /** @param {string} key */
      const used = (key) => Number([...sql.exec('select used from quota where key = ?', key)][0]?.used ?? 0);
      if (used('global') >= 200 || used(ipHash) >= 10) return false;
      for (const key of ['global', ipHash]) {
        sql.exec('insert into quota (key, day, used) values (?, ?, 1) on conflict(key) do update set used = used + 1', key, day);
      }
      return true;
    });
  }
}
