// @__NO_SIDE_EFFECTS__
function bs(e) {
  const t = /* @__PURE__ */ Object.create(null);
  for (const n of e.split(",")) t[n] = 1;
  return (n) => n in t;
}
const de = {}, _t = [], Pt = () => {
}, Xi = () => !1, vr = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && // uppercase letter
(e.charCodeAt(2) > 122 || e.charCodeAt(2) < 97), yr = (e) => e.startsWith("onUpdate:"), Fe = Object.assign, _i = (e, t) => {
  const n = e.indexOf(t);
  n > -1 && e.splice(n, 1);
}, _a = Object.prototype.hasOwnProperty, ie = (e, t) => _a.call(e, t), H = Array.isArray, $t = (e) => Gn(e) === "[object Map]", $i = (e) => Gn(e) === "[object Set]", $s = (e) => Gn(e) === "[object Date]", le = (e) => typeof e == "function", ve = (e) => typeof e == "string", Ze = (e) => typeof e == "symbol", he = (e) => e !== null && typeof e == "object", eo = (e) => (he(e) || le(e)) && le(e.then) && le(e.catch), to = Object.prototype.toString, Gn = (e) => to.call(e), $a = (e) => Gn(e).slice(8, -1), wr = (e) => Gn(e) === "[object Object]", br = (e) => ve(e) && e !== "NaN" && e[0] !== "-" && "" + parseInt(e, 10) === e, mn = /* @__PURE__ */ bs(
  // the leading comma is intentional so empty string "" is also included
  ",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"
), Ar = (e) => {
  const t = /* @__PURE__ */ Object.create(null);
  return ((n) => t[n] || (t[n] = e(n)));
}, el = /-\w/g, Ge = Ar(
  (e) => e.replace(el, (t) => t.slice(1).toUpperCase())
), tl = /\B([A-Z])/g, Pe = Ar(
  (e) => e.replace(tl, "-$1").toLowerCase()
), no = Ar((e) => e.charAt(0).toUpperCase() + e.slice(1)), Yr = Ar(
  (e) => e ? `on${no(e)}` : ""
), lt = (e, t) => !Object.is(e, t), zn = (e, ...t) => {
  for (let n = 0; n < e.length; n++)
    e[n](...t);
}, ro = (e, t, n, r = !1) => {
  Object.defineProperty(e, t, {
    configurable: !0,
    enumerable: !1,
    writable: r,
    value: n
  });
}, As = (e) => {
  const t = parseFloat(e);
  return isNaN(t) ? e : t;
}, ei = (e) => {
  const t = ve(e) ? Number(e) : NaN;
  return isNaN(t) ? e : t;
};
let ti;
const xr = () => ti || (ti = typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof window < "u" ? window : typeof global < "u" ? global : {});
function Ke(e) {
  if (H(e)) {
    const t = {};
    for (let n = 0; n < e.length; n++) {
      const r = e[n], s = ve(r) ? il(r) : Ke(r);
      if (s)
        for (const i in s)
          t[i] = s[i];
    }
    return t;
  } else if (ve(e) || he(e))
    return e;
}
const nl = /;(?![^(]*\))/g, rl = /:([^]+)/, sl = /\/\*[^]*?\*\//g;
function il(e) {
  const t = {};
  return e.replace(sl, "").split(nl).forEach((n) => {
    if (n) {
      const r = n.split(rl);
      r.length > 1 && (t[r[0].trim()] = r[1].trim());
    }
  }), t;
}
function be(e) {
  let t = "";
  if (ve(e))
    t = e;
  else if (H(e))
    for (let n = 0; n < e.length; n++) {
      const r = be(e[n]);
      r && (t += r + " ");
    }
  else if (he(e))
    for (const n in e)
      e[n] && (t += n + " ");
  return t.trim();
}
const ol = "itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly", al = /* @__PURE__ */ bs(ol);
function so(e) {
  return !!e || e === "";
}
function ll(e, t) {
  if (e.length !== t.length) return !1;
  let n = !0;
  for (let r = 0; n && r < e.length; r++)
    n = xs(e[r], t[r]);
  return n;
}
function xs(e, t) {
  if (e === t) return !0;
  let n = $s(e), r = $s(t);
  if (n || r)
    return n && r ? e.getTime() === t.getTime() : !1;
  if (n = Ze(e), r = Ze(t), n || r)
    return e === t;
  if (n = H(e), r = H(t), n || r)
    return n && r ? ll(e, t) : !1;
  if (n = he(e), r = he(t), n || r) {
    if (!n || !r)
      return !1;
    const s = Object.keys(e).length, i = Object.keys(t).length;
    if (s !== i)
      return !1;
    for (const o in e) {
      const a = e.hasOwnProperty(o), l = t.hasOwnProperty(o);
      if (a && !l || !a && l || !xs(e[o], t[o]))
        return !1;
    }
  }
  return String(e) === String(t);
}
const io = (e) => !!(e && e.__v_isRef === !0), Se = (e) => ve(e) ? e : e == null ? "" : H(e) || he(e) && (e.toString === to || !le(e.toString)) ? io(e) ? Se(e.value) : JSON.stringify(e, oo, 2) : String(e), oo = (e, t) => io(t) ? oo(e, t.value) : $t(t) ? {
  [`Map(${t.size})`]: [...t.entries()].reduce(
    (n, [r, s], i) => (n[Pr(r, i) + " =>"] = s, n),
    {}
  )
} : $i(t) ? {
  [`Set(${t.size})`]: [...t.values()].map((n) => Pr(n))
} : Ze(t) ? Pr(t) : he(t) && !H(t) && !wr(t) ? String(t) : t, Pr = (e, t = "") => {
  var n;
  return (
    // Symbol.description in es2019+ so we need to cast here to pass
    // the lib: es2016 check
    Ze(e) ? `Symbol(${(n = e.description) != null ? n : t})` : e
  );
};
let xe;
class cl {
  // TODO isolatedDeclarations "__v_skip"
  constructor(t = !1) {
    this.detached = t, this._active = !0, this._on = 0, this.effects = [], this.cleanups = [], this._isPaused = !1, this._warnOnRun = !0, this.__v_skip = !0, !t && xe && (xe.active ? (this.parent = xe, this.index = (xe.scopes || (xe.scopes = [])).push(
      this
    ) - 1) : (this._active = !1, this._warnOnRun = !1));
  }
  get active() {
    return this._active;
  }
  pause() {
    if (this._active) {
      this._isPaused = !0;
      let t, n;
      if (this.scopes) {
        const r = this.scopes.slice();
        for (t = 0, n = r.length; t < n; t++)
          r[t].pause();
      }
      for (t = 0, n = this.effects.length; t < n; t++)
        this.effects[t].pause();
    }
  }
  /**
   * Resumes the effect scope, including all child scopes and effects.
   */
  resume() {
    if (this._active && this._isPaused) {
      this._isPaused = !1;
      let t, n;
      if (this.scopes) {
        const s = this.scopes.slice();
        for (t = 0, n = s.length; t < n; t++)
          s[t].resume();
      }
      const r = this.effects.slice();
      for (t = 0, n = r.length; t < n; t++)
        r[t].resume();
    }
  }
  run(t) {
    if (this._active) {
      const n = xe;
      try {
        return xe = this, t();
      } finally {
        xe = n;
      }
    }
  }
  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  on() {
    ++this._on === 1 && (this.prevScope = xe, xe = this);
  }
  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  off() {
    if (this._on > 0 && --this._on === 0) {
      if (xe === this)
        xe = this.prevScope;
      else {
        let t = xe;
        for (; t; ) {
          if (t.prevScope === this) {
            t.prevScope = this.prevScope;
            break;
          }
          t = t.prevScope;
        }
      }
      this.prevScope = void 0;
    }
  }
  stop(t) {
    if (this._active) {
      this._active = !1;
      let n, r;
      for (n = 0, r = this.effects.length; n < r; n++)
        this.effects[n].stop();
      for (this.effects.length = 0, n = 0, r = this.cleanups.length; n < r; n++)
        this.cleanups[n]();
      if (this.cleanups.length = 0, this.scopes) {
        const s = this.scopes.slice();
        for (n = 0, r = s.length; n < r; n++)
          s[n].stop(!0);
        this.scopes.length = 0;
      }
      if (!this.detached && this.parent && !t) {
        const s = this.parent.scopes.pop();
        s && s !== this && (this.parent.scopes[this.index] = s, s.index = this.index);
      }
      this.parent = void 0;
    }
  }
}
function ul() {
  return xe;
}
function ao(e, t = !1) {
  xe && xe.cleanups.push(e);
}
let ue;
const jr = /* @__PURE__ */ new WeakSet();
class lo {
  constructor(t) {
    this.fn = t, this.deps = void 0, this.depsTail = void 0, this.flags = 5, this.next = void 0, this.cleanup = void 0, this.scheduler = void 0, xe && (xe.active ? xe.effects.push(this) : this.flags &= -2);
  }
  pause() {
    this.flags |= 64;
  }
  resume() {
    this.flags & 64 && (this.flags &= -65, jr.has(this) && (jr.delete(this), this.trigger()));
  }
  /**
   * @internal
   */
  notify() {
    this.flags & 2 && !(this.flags & 32) || this.flags & 8 || uo(this);
  }
  run() {
    if (!(this.flags & 1))
      return this.fn();
    this.flags |= 2, ni(this), fo(this);
    const t = ue, n = Xe;
    ue = this, Xe = !0;
    try {
      return this.fn();
    } finally {
      ho(this), ue = t, Xe = n, this.flags &= -3;
    }
  }
  stop() {
    if (this.flags & 1) {
      for (let t = this.deps; t; t = t.nextDep)
        Ss(t);
      this.deps = this.depsTail = void 0, ni(this), this.onStop && this.onStop(), this.flags &= -2;
    }
  }
  trigger() {
    this.flags & 64 ? jr.add(this) : this.scheduler ? this.scheduler() : this.runIfDirty();
  }
  /**
   * @internal
   */
  runIfDirty() {
    $r(this) && this.run();
  }
  get dirty() {
    return $r(this);
  }
}
let co = 0, vn, yn;
function uo(e, t = !1) {
  if (e.flags |= 8, t) {
    e.next = yn, yn = e;
    return;
  }
  e.next = vn, vn = e;
}
function Vs() {
  co++;
}
function Cs() {
  if (--co > 0)
    return;
  if (yn) {
    let t = yn;
    for (yn = void 0; t; ) {
      const n = t.next;
      t.next = void 0, t.flags &= -9, t = n;
    }
  }
  let e;
  for (; vn; ) {
    let t = vn;
    for (vn = void 0; t; ) {
      const n = t.next;
      if (t.next = void 0, t.flags &= -9, t.flags & 1)
        try {
          t.trigger();
        } catch (r) {
          e || (e = r);
        }
      t = n;
    }
  }
  if (e) throw e;
}
function fo(e) {
  for (let t = e.deps; t; t = t.nextDep)
    t.version = -1, t.prevActiveLink = t.dep.activeLink, t.dep.activeLink = t;
}
function ho(e) {
  let t, n = e.depsTail, r = n;
  for (; r; ) {
    const s = r.prevDep;
    r.version === -1 ? (r === n && (n = s), Ss(r), fl(r)) : t = r, r.dep.activeLink = r.prevActiveLink, r.prevActiveLink = void 0, r = s;
  }
  e.deps = t, e.depsTail = n;
}
function $r(e) {
  for (let t = e.deps; t; t = t.nextDep)
    if (t.dep.version !== t.version || t.dep.computed && (po(t.dep.computed) || t.dep.version !== t.version))
      return !0;
  return !!e._dirty;
}
function po(e) {
  if (e.flags & 4 && !(e.flags & 16) || (e.flags &= -17, e.globalVersion === Vn) || (e.globalVersion = Vn, !e.isSSR && e.flags & 128 && (!e.deps && !e._dirty || !$r(e))))
    return;
  e.flags |= 2;
  const t = e.dep, n = ue, r = Xe;
  ue = e, Xe = !0;
  try {
    fo(e);
    const s = e.fn(e._value);
    (t.version === 0 || lt(s, e._value)) && (e.flags |= 128, e._value = s, t.version++);
  } catch (s) {
    throw t.version++, s;
  } finally {
    ue = n, Xe = r, ho(e), e.flags &= -3;
  }
}
function Ss(e, t = !1) {
  const { dep: n, prevSub: r, nextSub: s } = e;
  if (r && (r.nextSub = s, e.prevSub = void 0), s && (s.prevSub = r, e.nextSub = void 0), n.subs === e && (n.subs = r, !r && n.computed)) {
    n.computed.flags &= -5;
    for (let i = n.computed.deps; i; i = i.nextDep)
      Ss(i, !0);
  }
  !t && !--n.sc && n.map && n.map.delete(n.key);
}
function fl(e) {
  const { prevDep: t, nextDep: n } = e;
  t && (t.nextDep = n, e.prevDep = void 0), n && (n.prevDep = t, e.nextDep = void 0);
}
let Xe = !0;
const go = [];
function Bt() {
  go.push(Xe), Xe = !1;
}
function kt() {
  const e = go.pop();
  Xe = e === void 0 ? !0 : e;
}
function ni(e) {
  const { cleanup: t } = e;
  if (e.cleanup = void 0, t) {
    const n = ue;
    ue = void 0;
    try {
      t();
    } finally {
      ue = n;
    }
  }
}
let Vn = 0;
class hl {
  constructor(t, n) {
    this.sub = t, this.dep = n, this.version = n.version, this.nextDep = this.prevDep = this.nextSub = this.prevSub = this.prevActiveLink = void 0;
  }
}
class Es {
  // TODO isolatedDeclarations "__v_skip"
  constructor(t) {
    this.computed = t, this.version = 0, this.activeLink = void 0, this.subs = void 0, this.map = void 0, this.key = void 0, this.sc = 0, this.__v_skip = !0;
  }
  track(t) {
    if (!ue || !Xe || ue === this.computed)
      return;
    let n = this.activeLink;
    if (n === void 0 || n.sub !== ue)
      n = this.activeLink = new hl(ue, this), ue.deps ? (n.prevDep = ue.depsTail, ue.depsTail.nextDep = n, ue.depsTail = n) : ue.deps = ue.depsTail = n, mo(n);
    else if (n.version === -1 && (n.version = this.version, n.nextDep)) {
      const r = n.nextDep;
      r.prevDep = n.prevDep, n.prevDep && (n.prevDep.nextDep = r), n.prevDep = ue.depsTail, n.nextDep = void 0, ue.depsTail.nextDep = n, ue.depsTail = n, ue.deps === n && (ue.deps = r);
    }
    return n;
  }
  trigger(t) {
    this.version++, Vn++, this.notify(t);
  }
  notify(t) {
    Vs();
    try {
      for (let n = this.subs; n; n = n.prevSub)
        n.sub.notify() && n.sub.dep.notify();
    } finally {
      Cs();
    }
  }
}
function mo(e) {
  if (e.dep.sc++, e.sub.flags & 4) {
    const t = e.dep.computed;
    if (t && !e.dep.subs) {
      t.flags |= 20;
      for (let r = t.deps; r; r = r.nextDep)
        mo(r);
    }
    const n = e.dep.subs;
    n !== e && (e.prevSub = n, n && (n.nextSub = e)), e.dep.subs = e;
  }
}
const nr = /* @__PURE__ */ new WeakMap(), jt = /* @__PURE__ */ Symbol(
  ""
), es = /* @__PURE__ */ Symbol(
  ""
), Cn = /* @__PURE__ */ Symbol(
  ""
);
function Be(e, t, n) {
  if (Xe && ue) {
    let r = nr.get(e);
    r || nr.set(e, r = /* @__PURE__ */ new Map());
    let s = r.get(n);
    s || (r.set(n, s = new Es()), s.map = r, s.key = n), s.track();
  }
}
function mt(e, t, n, r, s, i) {
  const o = nr.get(e);
  if (!o) {
    Vn++;
    return;
  }
  const a = (l) => {
    l && l.trigger();
  };
  if (Vs(), t === "clear")
    o.forEach(a);
  else {
    const l = H(e), c = l && br(n);
    if (l && n === "length") {
      const u = Number(r);
      o.forEach((h, m) => {
        (m === "length" || m === Cn || !Ze(m) && m >= u) && a(h);
      });
    } else
      switch ((n !== void 0 || o.has(void 0)) && a(o.get(n)), c && a(o.get(Cn)), t) {
        case "add":
          l ? c && a(o.get("length")) : (a(o.get(jt)), $t(e) && a(o.get(es)));
          break;
        case "delete":
          l || (a(o.get(jt)), $t(e) && a(o.get(es)));
          break;
        case "set":
          $t(e) && a(o.get(jt));
          break;
      }
  }
  Cs();
}
function dl(e, t) {
  const n = nr.get(e);
  return n && n.get(t);
}
function Zt(e) {
  const t = /* @__PURE__ */ ne(e);
  return t === e ? t : (Be(t, "iterate", Cn), /* @__PURE__ */ Le(e) ? t : t.map(_e));
}
function Vr(e) {
  return Be(e = /* @__PURE__ */ ne(e), "iterate", Cn), e;
}
function ot(e, t) {
  return /* @__PURE__ */ Vt(e) ? nn(/* @__PURE__ */ Kt(e) ? _e(t) : t) : _e(t);
}
const pl = {
  __proto__: null,
  [Symbol.iterator]() {
    return Kr(this, Symbol.iterator, (e) => ot(this, e));
  },
  concat(...e) {
    return Zt(this).concat(
      ...e.map((t) => H(t) ? Zt(t) : t)
    );
  },
  entries() {
    return Kr(this, "entries", (e) => (e[1] = ot(this, e[1]), e));
  },
  every(e, t) {
    return dt(this, "every", e, t, void 0, arguments);
  },
  filter(e, t) {
    return dt(
      this,
      "filter",
      e,
      t,
      (n) => n.map((r) => ot(this, r)),
      arguments
    );
  },
  find(e, t) {
    return dt(
      this,
      "find",
      e,
      t,
      (n) => ot(this, n),
      arguments
    );
  },
  findIndex(e, t) {
    return dt(this, "findIndex", e, t, void 0, arguments);
  },
  findLast(e, t) {
    return dt(
      this,
      "findLast",
      e,
      t,
      (n) => ot(this, n),
      arguments
    );
  },
  findLastIndex(e, t) {
    return dt(this, "findLastIndex", e, t, void 0, arguments);
  },
  // flat, flatMap could benefit from ARRAY_ITERATE but are not straight-forward to implement
  forEach(e, t) {
    return dt(this, "forEach", e, t, void 0, arguments);
  },
  includes(...e) {
    return Nr(this, "includes", e);
  },
  indexOf(...e) {
    return Nr(this, "indexOf", e);
  },
  join(e) {
    return Zt(this).join(e);
  },
  // keys() iterator only reads `length`, no optimization required
  lastIndexOf(...e) {
    return Nr(this, "lastIndexOf", e);
  },
  map(e, t) {
    return dt(this, "map", e, t, void 0, arguments);
  },
  pop() {
    return fn(this, "pop");
  },
  push(...e) {
    return fn(this, "push", e);
  },
  reduce(e, ...t) {
    return ri(this, "reduce", e, t);
  },
  reduceRight(e, ...t) {
    return ri(this, "reduceRight", e, t);
  },
  shift() {
    return fn(this, "shift");
  },
  // slice could use ARRAY_ITERATE but also seems to beg for range tracking
  some(e, t) {
    return dt(this, "some", e, t, void 0, arguments);
  },
  splice(...e) {
    return fn(this, "splice", e);
  },
  toReversed() {
    return Zt(this).toReversed();
  },
  toSorted(e) {
    return Zt(this).toSorted(e);
  },
  toSpliced(...e) {
    return Zt(this).toSpliced(...e);
  },
  unshift(...e) {
    return fn(this, "unshift", e);
  },
  values() {
    return Kr(this, "values", (e) => ot(this, e));
  }
};
function Kr(e, t, n) {
  const r = Vr(e), s = r[t]();
  return r !== e && !/* @__PURE__ */ Le(e) && (s._next = s.next, s.next = () => {
    const i = s._next();
    return i.done || (i.value = n(i.value)), i;
  }), s;
}
const gl = Array.prototype;
function dt(e, t, n, r, s, i) {
  const o = Vr(e), a = o !== e && !/* @__PURE__ */ Le(e), l = o[t];
  if (l !== gl[t]) {
    const h = l.apply(e, i);
    return a ? _e(h) : h;
  }
  let c = n;
  o !== e && (a ? c = function(h, m) {
    return n.call(this, ot(e, h), m, e);
  } : n.length > 2 && (c = function(h, m) {
    return n.call(this, h, m, e);
  }));
  const u = l.call(o, c, r);
  return a && s ? s(u) : u;
}
function ri(e, t, n, r) {
  const s = Vr(e), i = s !== e && !/* @__PURE__ */ Le(e);
  let o = n, a = !1;
  s !== e && (i ? (a = r.length === 0, o = function(c, u, h) {
    return a && (a = !1, c = ot(e, c)), n.call(this, c, ot(e, u), h, e);
  }) : n.length > 3 && (o = function(c, u, h) {
    return n.call(this, c, u, h, e);
  }));
  const l = s[t](o, ...r);
  return a ? ot(e, l) : l;
}
function Nr(e, t, n) {
  const r = /* @__PURE__ */ ne(e);
  Be(r, "iterate", Cn);
  const s = r[t](...n);
  return (s === -1 || s === !1) && /* @__PURE__ */ Ir(n[0]) ? (n[0] = /* @__PURE__ */ ne(n[0]), r[t](...n)) : s;
}
function fn(e, t, n = []) {
  Bt(), Vs();
  const r = (/* @__PURE__ */ ne(e))[t].apply(e, n);
  return Cs(), kt(), r;
}
const ml = /* @__PURE__ */ bs("__proto__,__v_isRef,__isVue"), vo = new Set(
  /* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((e) => e !== "arguments" && e !== "caller").map((e) => Symbol[e]).filter(Ze)
);
function vl(e) {
  Ze(e) || (e = String(e));
  const t = /* @__PURE__ */ ne(this);
  return Be(t, "has", e), t.hasOwnProperty(e);
}
class yo {
  constructor(t = !1, n = !1) {
    this._isReadonly = t, this._isShallow = n;
  }
  get(t, n, r) {
    if (n === "__v_skip") return t.__v_skip;
    const s = this._isReadonly, i = this._isShallow;
    if (n === "__v_isReactive")
      return !s;
    if (n === "__v_isReadonly")
      return s;
    if (n === "__v_isShallow")
      return i;
    if (n === "__v_raw")
      return r === (s ? i ? Co : Vo : i ? xo : Ao).get(t) || // receiver is not the reactive proxy, but has the same prototype
      // this means the receiver is a user proxy of the reactive proxy
      Object.getPrototypeOf(t) === Object.getPrototypeOf(r) ? t : void 0;
    const o = H(t);
    if (!s) {
      let l;
      if (o && (l = pl[n]))
        return l;
      if (n === "hasOwnProperty")
        return vl;
    }
    const a = Reflect.get(
      t,
      n,
      // if this is a proxy wrapping a ref, return methods using the raw ref
      // as receiver so that we don't have to call `toRaw` on the ref in all
      // its class methods
      /* @__PURE__ */ Ce(t) ? t : r
    );
    if ((Ze(n) ? vo.has(n) : ml(n)) || (s || Be(t, "get", n), i))
      return a;
    if (/* @__PURE__ */ Ce(a)) {
      const l = o && br(n) ? a : a.value;
      return s && he(l) ? /* @__PURE__ */ Sn(l) : l;
    }
    return he(a) ? s ? /* @__PURE__ */ Sn(a) : /* @__PURE__ */ Sr(a) : a;
  }
}
class wo extends yo {
  constructor(t = !1) {
    super(!1, t);
  }
  set(t, n, r, s) {
    let i = t[n];
    const o = H(t) && br(n);
    if (!this._isShallow) {
      const c = /* @__PURE__ */ Vt(i);
      if (!/* @__PURE__ */ Le(r) && !/* @__PURE__ */ Vt(r) && (i = /* @__PURE__ */ ne(i), r = /* @__PURE__ */ ne(r)), !o && /* @__PURE__ */ Ce(i) && !/* @__PURE__ */ Ce(r))
        return c || (i.value = r), !0;
    }
    const a = o ? Number(n) < t.length : ie(t, n), l = Reflect.set(
      t,
      n,
      r,
      /* @__PURE__ */ Ce(t) ? t : s
    );
    return t === /* @__PURE__ */ ne(s) && l && (a ? lt(r, i) && mt(t, "set", n, r) : mt(t, "add", n, r)), l;
  }
  deleteProperty(t, n) {
    const r = ie(t, n);
    t[n];
    const s = Reflect.deleteProperty(t, n);
    return s && r && mt(t, "delete", n, void 0), s;
  }
  has(t, n) {
    const r = Reflect.has(t, n);
    return (!Ze(n) || !vo.has(n)) && Be(t, "has", n), r;
  }
  ownKeys(t) {
    return Be(
      t,
      "iterate",
      H(t) ? "length" : jt
    ), Reflect.ownKeys(t);
  }
}
class bo extends yo {
  constructor(t = !1) {
    super(!0, t);
  }
  set(t, n) {
    return !0;
  }
  deleteProperty(t, n) {
    return !0;
  }
}
const yl = /* @__PURE__ */ new wo(), wl = /* @__PURE__ */ new bo(), bl = /* @__PURE__ */ new wo(!0), Al = /* @__PURE__ */ new bo(!0), ts = (e) => e, Kn = (e) => Reflect.getPrototypeOf(e);
function xl(e, t, n) {
  return function(...r) {
    const s = this.__v_raw, i = /* @__PURE__ */ ne(s), o = $t(i), a = e === "entries" || e === Symbol.iterator && o, l = e === "keys" && o, c = s[e](...r), u = n ? ts : t ? nn : _e;
    return !t && Be(
      i,
      "iterate",
      l ? es : jt
    ), Fe(
      // inheriting all iterator properties
      Object.create(c),
      {
        // iterator protocol
        next() {
          const { value: h, done: m } = c.next();
          return m ? { value: h, done: m } : {
            value: a ? [u(h[0]), u(h[1])] : u(h),
            done: m
          };
        }
      }
    );
  };
}
function Nn(e) {
  return function(...t) {
    return e === "delete" ? !1 : e === "clear" ? void 0 : this;
  };
}
function Vl(e, t) {
  const n = {
    get(s) {
      const i = this.__v_raw, o = /* @__PURE__ */ ne(i), a = /* @__PURE__ */ ne(s);
      e || (lt(s, a) && Be(o, "get", s), Be(o, "get", a));
      const { has: l } = Kn(o), c = t ? ts : e ? nn : _e;
      if (l.call(o, s))
        return c(i.get(s));
      if (l.call(o, a))
        return c(i.get(a));
      i !== o && i.get(s);
    },
    get size() {
      const s = this.__v_raw;
      return !e && Be(/* @__PURE__ */ ne(s), "iterate", jt), s.size;
    },
    has(s) {
      const i = this.__v_raw, o = /* @__PURE__ */ ne(i), a = /* @__PURE__ */ ne(s);
      return e || (lt(s, a) && Be(o, "has", s), Be(o, "has", a)), s === a ? i.has(s) : i.has(s) || i.has(a);
    },
    forEach(s, i) {
      const o = this, a = o.__v_raw, l = /* @__PURE__ */ ne(a), c = t ? ts : e ? nn : _e;
      return !e && Be(l, "iterate", jt), a.forEach((u, h) => s.call(i, c(u), c(h), o));
    }
  };
  return Fe(
    n,
    e ? {
      add: Nn("add"),
      set: Nn("set"),
      delete: Nn("delete"),
      clear: Nn("clear")
    } : {
      add(s) {
        const i = /* @__PURE__ */ ne(this), o = Kn(i), a = /* @__PURE__ */ ne(s), l = !t && !/* @__PURE__ */ Le(s) && !/* @__PURE__ */ Vt(s) ? a : s;
        return o.has.call(i, l) || lt(s, l) && o.has.call(i, s) || lt(a, l) && o.has.call(i, a) || (i.add(l), mt(i, "add", l, l)), this;
      },
      set(s, i) {
        !t && !/* @__PURE__ */ Le(i) && !/* @__PURE__ */ Vt(i) && (i = /* @__PURE__ */ ne(i));
        const o = /* @__PURE__ */ ne(this), { has: a, get: l } = Kn(o);
        let c = a.call(o, s);
        c || (s = /* @__PURE__ */ ne(s), c = a.call(o, s));
        const u = l.call(o, s);
        return o.set(s, i), c ? lt(i, u) && mt(o, "set", s, i) : mt(o, "add", s, i), this;
      },
      delete(s) {
        const i = /* @__PURE__ */ ne(this), { has: o, get: a } = Kn(i);
        let l = o.call(i, s);
        l || (s = /* @__PURE__ */ ne(s), l = o.call(i, s)), a && a.call(i, s);
        const c = i.delete(s);
        return l && mt(i, "delete", s, void 0), c;
      },
      clear() {
        const s = /* @__PURE__ */ ne(this), i = s.size !== 0, o = s.clear();
        return i && mt(
          s,
          "clear",
          void 0,
          void 0
        ), o;
      }
    }
  ), [
    "keys",
    "values",
    "entries",
    Symbol.iterator
  ].forEach((s) => {
    n[s] = xl(s, e, t);
  }), n;
}
function Cr(e, t) {
  const n = Vl(e, t);
  return (r, s, i) => s === "__v_isReactive" ? !e : s === "__v_isReadonly" ? e : s === "__v_raw" ? r : Reflect.get(
    ie(n, s) && s in r ? n : r,
    s,
    i
  );
}
const Cl = {
  get: /* @__PURE__ */ Cr(!1, !1)
}, Sl = {
  get: /* @__PURE__ */ Cr(!1, !0)
}, El = {
  get: /* @__PURE__ */ Cr(!0, !1)
}, Il = {
  get: /* @__PURE__ */ Cr(!0, !0)
}, Ao = /* @__PURE__ */ new WeakMap(), xo = /* @__PURE__ */ new WeakMap(), Vo = /* @__PURE__ */ new WeakMap(), Co = /* @__PURE__ */ new WeakMap();
function Ml(e) {
  switch (e) {
    case "Object":
    case "Array":
      return 1;
    case "Map":
    case "Set":
    case "WeakMap":
    case "WeakSet":
      return 2;
    default:
      return 0;
  }
}
// @__NO_SIDE_EFFECTS__
function Sr(e) {
  return /* @__PURE__ */ Vt(e) ? e : Er(
    e,
    !1,
    yl,
    Cl,
    Ao
  );
}
// @__NO_SIDE_EFFECTS__
function Is(e) {
  return Er(
    e,
    !1,
    bl,
    Sl,
    xo
  );
}
// @__NO_SIDE_EFFECTS__
function Sn(e) {
  return Er(
    e,
    !0,
    wl,
    El,
    Vo
  );
}
// @__NO_SIDE_EFFECTS__
function So(e) {
  return Er(
    e,
    !0,
    Al,
    Il,
    Co
  );
}
function Er(e, t, n, r, s) {
  if (!he(e) || e.__v_raw && !(t && e.__v_isReactive) || e.__v_skip || !Object.isExtensible(e))
    return e;
  const i = s.get(e);
  if (i)
    return i;
  const o = Ml($a(e));
  if (o === 0)
    return e;
  const a = new Proxy(
    e,
    o === 2 ? r : n
  );
  return s.set(e, a), a;
}
// @__NO_SIDE_EFFECTS__
function Kt(e) {
  return /* @__PURE__ */ Vt(e) ? /* @__PURE__ */ Kt(e.__v_raw) : !!(e && e.__v_isReactive);
}
// @__NO_SIDE_EFFECTS__
function Vt(e) {
  return !!(e && e.__v_isReadonly);
}
// @__NO_SIDE_EFFECTS__
function Le(e) {
  return !!(e && e.__v_isShallow);
}
// @__NO_SIDE_EFFECTS__
function Ir(e) {
  return e ? !!e.__v_raw : !1;
}
// @__NO_SIDE_EFFECTS__
function ne(e) {
  const t = e && e.__v_raw;
  return t ? /* @__PURE__ */ ne(t) : e;
}
function Bl(e) {
  return !ie(e, "__v_skip") && Object.isExtensible(e) && ro(e, "__v_skip", !0), e;
}
const _e = (e) => he(e) ? /* @__PURE__ */ Sr(e) : e, nn = (e) => he(e) ? /* @__PURE__ */ Sn(e) : e;
// @__NO_SIDE_EFFECTS__
function Ce(e) {
  return e ? e.__v_isRef === !0 : !1;
}
// @__NO_SIDE_EFFECTS__
function L(e) {
  return Eo(e, !1);
}
// @__NO_SIDE_EFFECTS__
function si(e) {
  return Eo(e, !0);
}
function Eo(e, t) {
  return /* @__PURE__ */ Ce(e) ? e : new kl(e, t);
}
class kl {
  constructor(t, n) {
    this.dep = new Es(), this.__v_isRef = !0, this.__v_isShallow = !1, this._rawValue = n ? t : /* @__PURE__ */ ne(t), this._value = n ? t : _e(t), this.__v_isShallow = n;
  }
  get value() {
    return this.dep.track(), this._value;
  }
  set value(t) {
    const n = this._rawValue, r = this.__v_isShallow || /* @__PURE__ */ Le(t) || /* @__PURE__ */ Vt(t);
    t = r ? t : /* @__PURE__ */ ne(t), lt(t, n) && (this._rawValue = t, this._value = r ? t : _e(t), this.dep.trigger());
  }
}
function ee(e) {
  return /* @__PURE__ */ Ce(e) ? e.value : e;
}
const Rl = {
  get: (e, t, n) => t === "__v_raw" ? e : ee(Reflect.get(e, t, n)),
  set: (e, t, n, r) => {
    const s = e[t];
    return /* @__PURE__ */ Ce(s) && !/* @__PURE__ */ Ce(n) ? (s.value = n, !0) : Reflect.set(e, t, n, r);
  }
};
function Io(e) {
  return /* @__PURE__ */ Kt(e) ? e : new Proxy(e, Rl);
}
// @__NO_SIDE_EFFECTS__
function Mo(e) {
  const t = H(e) ? new Array(e.length) : {};
  for (const n in e)
    t[n] = Ql(e, n);
  return t;
}
class Fl {
  constructor(t, n, r) {
    this._object = t, this._defaultValue = r, this.__v_isRef = !0, this._value = void 0, this._key = Ze(n) ? n : String(n), this._raw = /* @__PURE__ */ ne(t);
    let s = !0, i = t;
    if (!H(t) || Ze(this._key) || !br(this._key))
      do
        s = !/* @__PURE__ */ Ir(i) || /* @__PURE__ */ Le(i);
      while (s && (i = i.__v_raw));
    this._shallow = s;
  }
  get value() {
    let t = this._object[this._key];
    return this._shallow && (t = ee(t)), this._value = t === void 0 ? this._defaultValue : t;
  }
  set value(t) {
    if (this._shallow && /* @__PURE__ */ Ce(this._raw[this._key])) {
      const n = this._object[this._key];
      if (/* @__PURE__ */ Ce(n)) {
        n.value = t;
        return;
      }
    }
    this._object[this._key] = t;
  }
  get dep() {
    return dl(this._raw, this._key);
  }
}
function Ql(e, t, n) {
  return new Fl(e, t, n);
}
class Dl {
  constructor(t, n, r) {
    this.fn = t, this.setter = n, this._value = void 0, this.dep = new Es(this), this.__v_isRef = !0, this.deps = void 0, this.depsTail = void 0, this.flags = 16, this.globalVersion = Vn - 1, this.next = void 0, this.effect = this, this.__v_isReadonly = !n, this.isSSR = r;
  }
  /**
   * @internal
   */
  notify() {
    if (this.flags |= 16, !(this.flags & 8) && // avoid infinite self recursion
    ue !== this)
      return uo(this, !0), !0;
  }
  get value() {
    const t = this.dep.track();
    return po(this), t && (t.version = this.dep.version), this._value;
  }
  set value(t) {
    this.setter && this.setter(t);
  }
}
// @__NO_SIDE_EFFECTS__
function Ul(e, t, n = !1) {
  let r, s;
  return le(e) ? r = e : (r = e.get, s = e.set), new Dl(r, s, n);
}
const Ln = {}, rr = /* @__PURE__ */ new WeakMap();
let Gt;
function Ol(e, t = !1, n = Gt) {
  if (n) {
    let r = rr.get(n);
    r || rr.set(n, r = []), r.push(e);
  }
}
function Gl(e, t, n = de) {
  const { immediate: r, deep: s, once: i, scheduler: o, augmentJob: a, call: l } = n, c = (E) => s ? E : /* @__PURE__ */ Le(E) || s === !1 || s === 0 ? vt(E, 1) : vt(E);
  let u, h, m, g, w = !1, p = !1;
  if (/* @__PURE__ */ Ce(e) ? (h = () => e.value, w = /* @__PURE__ */ Le(e)) : /* @__PURE__ */ Kt(e) ? (h = () => c(e), w = !0) : H(e) ? (p = !0, w = e.some((E) => /* @__PURE__ */ Kt(E) || /* @__PURE__ */ Le(E)), h = () => e.map((E) => {
    if (/* @__PURE__ */ Ce(E))
      return E.value;
    if (/* @__PURE__ */ Kt(E))
      return c(E);
    if (le(E))
      return l ? l(E, 2) : E();
  })) : le(e) ? t ? h = l ? () => l(e, 2) : e : h = () => {
    if (m) {
      Bt();
      try {
        m();
      } finally {
        kt();
      }
    }
    const E = Gt;
    Gt = u;
    try {
      return l ? l(e, 3, [g]) : e(g);
    } finally {
      Gt = E;
    }
  } : h = Pt, t && s) {
    const E = h, b = s === !0 ? 1 / 0 : s;
    h = () => vt(E(), b);
  }
  const R = ul(), F = () => {
    u.stop(), R && R.active && _i(R.effects, u);
  };
  if (i && t) {
    const E = t;
    t = (...b) => {
      const C = E(...b);
      return F(), C;
    };
  }
  let I = p ? new Array(e.length).fill(Ln) : Ln;
  const O = (E) => {
    if (!(!(u.flags & 1) || !u.dirty && !E))
      if (t) {
        const b = u.run();
        if (E || s || w || (p ? b.some((C, M) => lt(C, I[M])) : lt(b, I))) {
          m && m();
          const C = Gt;
          Gt = u;
          try {
            const M = [
              b,
              // pass undefined as the old value when it's changed for the first time
              I === Ln ? void 0 : p && I[0] === Ln ? [] : I,
              g
            ];
            I = b, l ? l(t, 3, M) : (
              // @ts-expect-error
              t(...M)
            );
          } finally {
            Gt = C;
          }
        }
      } else
        u.run();
  };
  return a && a(O), u = new lo(h), u.scheduler = o ? () => o(O, !1) : O, g = (E) => Ol(E, !1, u), m = u.onStop = () => {
    const E = rr.get(u);
    if (E) {
      if (l)
        l(E, 4);
      else
        for (const b of E) b();
      rr.delete(u);
    }
  }, t ? r ? O(!0) : I = u.run() : o ? o(O.bind(null, !0), !0) : u.run(), F.pause = u.pause.bind(u), F.resume = u.resume.bind(u), F.stop = F, F;
}
function vt(e, t = 1 / 0, n) {
  if (t <= 0 || !he(e) || e.__v_skip || (n = n || /* @__PURE__ */ new Map(), (n.get(e) || 0) >= t))
    return e;
  if (n.set(e, t), t--, /* @__PURE__ */ Ce(e))
    vt(e.value, t, n);
  else if (H(e))
    for (let r = 0; r < e.length; r++)
      vt(e[r], t, n);
  else if ($i(e) || $t(e))
    e.forEach((r) => {
      vt(r, t, n);
    });
  else if (wr(e)) {
    for (const r in e)
      vt(e[r], t, n);
    for (const r of Object.getOwnPropertySymbols(e))
      Object.prototype.propertyIsEnumerable.call(e, r) && vt(e[r], t, n);
  }
  return e;
}
function Tn(e, t, n, r) {
  try {
    return r ? e(...r) : e();
  } catch (s) {
    Mr(s, t, n);
  }
}
function ut(e, t, n, r) {
  if (le(e)) {
    const s = Tn(e, t, n, r);
    return s && eo(s) && s.catch((i) => {
      Mr(i, t, n);
    }), s;
  }
  if (H(e)) {
    const s = [];
    for (let i = 0; i < e.length; i++)
      s.push(ut(e[i], t, n, r));
    return s;
  }
}
function Mr(e, t, n, r = !0) {
  const s = t ? t.vnode : null, { errorHandler: i, throwUnhandledErrorInProduction: o } = t && t.appContext.config || de;
  if (t) {
    let a = t.parent;
    const l = t.proxy, c = `https://vuejs.org/error-reference/#runtime-${n}`;
    for (; a; ) {
      const u = a.ec;
      if (u) {
        for (let h = 0; h < u.length; h++)
          if (u[h](e, l, c) === !1)
            return;
      }
      a = a.parent;
    }
    if (i) {
      Bt(), Tn(i, null, 10, [
        e,
        l,
        c
      ]), kt();
      return;
    }
  }
  Tl(e, n, s, r, o);
}
function Tl(e, t, n, r = !0, s = !1) {
  if (s)
    throw e;
  console.error(e);
}
const Re = [];
let it = -1;
const en = [];
let St = null, zt = 0;
const Bo = /* @__PURE__ */ Promise.resolve();
let sr = null;
function qe(e) {
  const t = sr || Bo;
  return e ? t.then(this ? e.bind(this) : e) : t;
}
function Yl(e) {
  let t = it + 1, n = Re.length;
  for (; t < n; ) {
    const r = t + n >>> 1, s = Re[r], i = En(s);
    i < e || i === e && s.flags & 2 ? t = r + 1 : n = r;
  }
  return t;
}
function Ms(e) {
  if (!(e.flags & 1)) {
    const t = En(e), n = Re[Re.length - 1];
    !n || // fast path when the job id is larger than the tail
    !(e.flags & 2) && t >= En(n) ? Re.push(e) : Re.splice(Yl(t), 0, e), e.flags |= 1, ko();
  }
}
function ko() {
  sr || (sr = Bo.then(Fo));
}
function Pl(e) {
  H(e) ? en.push(...e) : St && e.id === -1 ? St.splice(zt + 1, 0, e) : e.flags & 1 || (en.push(e), e.flags |= 1), ko();
}
function ii(e, t, n = it + 1) {
  for (; n < Re.length; n++) {
    const r = Re[n];
    if (r && r.flags & 2) {
      if (e && r.id !== e.uid)
        continue;
      Re.splice(n, 1), n--, r.flags & 4 && (r.flags &= -2), r(), r.flags & 4 || (r.flags &= -2);
    }
  }
}
function Ro(e) {
  if (en.length) {
    const t = [...new Set(en)].sort(
      (n, r) => En(n) - En(r)
    );
    if (en.length = 0, St) {
      St.push(...t);
      return;
    }
    for (St = t, zt = 0; zt < St.length; zt++) {
      const n = St[zt];
      n.flags & 4 && (n.flags &= -2), n.flags & 8 || n(), n.flags &= -2;
    }
    St = null, zt = 0;
  }
}
const En = (e) => e.id == null ? e.flags & 2 ? -1 : 1 / 0 : e.id;
function Fo(e) {
  try {
    for (it = 0; it < Re.length; it++) {
      const t = Re[it];
      t && !(t.flags & 8) && (t.flags & 4 && (t.flags &= -2), Tn(
        t,
        t.i,
        t.i ? 15 : 14
      ), t.flags & 4 || (t.flags &= -2));
    }
  } finally {
    for (; it < Re.length; it++) {
      const t = Re[it];
      t && (t.flags &= -2);
    }
    it = -1, Re.length = 0, Ro(), sr = null, (Re.length || en.length) && Fo();
  }
}
let Je = null, Qo = null;
function ir(e) {
  const t = Je;
  return Je = e, Qo = e && e.type.__scopeId || null, t;
}
function Xn(e, t = Je, n) {
  if (!t || e._n)
    return e;
  const r = (...s) => {
    r._d && ar(-1);
    const i = ir(t), o = Lt.length;
    let a;
    try {
      a = e(...s);
    } finally {
      for (let l = Lt.length; l > o; l--) Zo();
      ir(i), r._d && ar(1);
    }
    return a;
  };
  return r._n = !0, r._c = !0, r._d = !0, r;
}
function Bs(e, t) {
  if (Je === null)
    return e;
  const n = Fr(Je), r = e.dirs || (e.dirs = []);
  for (let s = 0; s < t.length; s++) {
    let [i, o, a, l = de] = t[s];
    i && (le(i) && (i = {
      mounted: i,
      updated: i
    }), i.deep && vt(o), r.push({
      dir: i,
      instance: n,
      value: o,
      oldValue: void 0,
      arg: a,
      modifiers: l
    }));
  }
  return e;
}
function Ut(e, t, n, r) {
  const s = e.dirs, i = t && t.dirs;
  for (let o = 0; o < s.length; o++) {
    const a = s[o];
    i && (a.oldValue = i[o].value);
    let l = a.dir[r];
    l && (Bt(), ut(l, n, 8, [
      e.el,
      a,
      e,
      t
    ]), kt());
  }
}
function Br(e, t) {
  if (je) {
    let n = je.provides;
    const r = je.parent && je.parent.provides;
    r === n && (n = je.provides = Object.create(r)), n[e] = t;
  }
}
function Ft(e, t, n = !1) {
  const r = Ds();
  if (r || Nt) {
    let s = Nt ? Nt._context.provides : r ? r.parent == null || r.ce ? r.vnode.appContext && r.vnode.appContext.provides : r.parent.provides : void 0;
    if (s && e in s)
      return s[e];
    if (arguments.length > 1)
      return n && le(t) ? t.call(r && r.proxy) : t;
  }
}
function jl() {
  return !!(Ds() || Nt);
}
const Kl = /* @__PURE__ */ Symbol.for("v-scx"), Nl = () => Ft(Kl);
function Qt(e, t) {
  return Do(e, null, t);
}
function Oe(e, t, n) {
  return Do(e, t, n);
}
function Do(e, t, n = de) {
  const { immediate: r, deep: s, flush: i, once: o } = n, a = Fe({}, n), l = t && r || !t && i !== "post";
  let c;
  if (Mn) {
    if (i === "sync") {
      const g = Nl();
      c = g.__watcherHandles || (g.__watcherHandles = []);
    } else if (!l) {
      const g = () => {
      };
      return g.stop = Pt, g.resume = Pt, g.pause = Pt, g;
    }
  }
  const u = je;
  a.call = (g, w, p) => ut(g, u, w, p);
  let h = !1;
  i === "post" ? a.scheduler = (g) => {
    Ue(g, u && u.suspense);
  } : i !== "sync" && (h = !0, a.scheduler = (g, w) => {
    w ? g() : Ms(g);
  }), a.augmentJob = (g) => {
    t && (g.flags |= 4), h && (g.flags |= 2, u && (g.id = u.uid, g.i = u));
  };
  const m = Gl(e, t, a);
  return Mn && (c ? c.push(m) : l && m()), m;
}
const Ll = /* @__PURE__ */ Symbol("_vte"), Wl = (e) => e.__isTeleport, Lr = /* @__PURE__ */ Symbol("_leaveCb");
function ks(e, t) {
  e.shapeFlag & 6 && e.component ? (e.transition = t, ks(e.component.subTree, t)) : e.shapeFlag & 128 ? (e.ssContent.transition = t.clone(e.ssContent), e.ssFallback.transition = t.clone(e.ssFallback)) : e.transition = t;
}
// @__NO_SIDE_EFFECTS__
function ke(e, t) {
  return le(e) ? (
    // #8236: extend call and options.name access are considered side-effects
    // by Rollup, so we have to wrap it in a pure-annotated IIFE.
    Fe({ name: e.name }, t, { setup: e })
  ) : e;
}
function ql() {
  const e = Ds();
  return e ? (e.appContext.config.idPrefix || "v") + "-" + e.ids[0] + e.ids[1]++ : "";
}
function Jl(e) {
  e.ids = [e.ids[0] + e.ids[2]++ + "-", 0, 0];
}
function oi(e, t) {
  let n;
  return !!((n = Object.getOwnPropertyDescriptor(e, t)) && !n.configurable);
}
const or = /* @__PURE__ */ new WeakMap();
function wn(e, t, n, r, s = !1) {
  if (H(e)) {
    e.forEach(
      (p, R) => wn(
        p,
        t && (H(t) ? t[R] : t),
        n,
        r,
        s
      )
    );
    return;
  }
  if (bn(r) && !s) {
    r.shapeFlag & 512 && r.type.__asyncResolved && r.component.subTree.component && wn(e, t, n, r.component.subTree);
    return;
  }
  const i = r.shapeFlag & 4 ? Fr(r.component) : r.el, o = s ? null : i, { i: a, r: l } = e, c = t && t.r, u = a.refs === de ? a.refs = {} : a.refs, h = a.setupState, m = /* @__PURE__ */ ne(h), g = h === de ? Xi : (p) => oi(u, p) ? !1 : ie(m, p), w = (p, R) => !(R && oi(u, R));
  if (c != null && c !== l) {
    if (ai(t), ve(c))
      u[c] = null, g(c) && (h[c] = null);
    else if (/* @__PURE__ */ Ce(c)) {
      const p = t;
      w(c, p.k) && (c.value = null), p.k && (u[p.k] = null);
    }
  }
  if (le(l))
    Tn(l, a, 12, [o, u]);
  else {
    const p = ve(l), R = /* @__PURE__ */ Ce(l);
    if (p || R) {
      const F = () => {
        if (e.f) {
          const I = p ? g(l) ? h[l] : u[l] : w() || !e.k ? l.value : u[e.k];
          if (s)
            H(I) && _i(I, i);
          else if (H(I))
            I.includes(i) || I.push(i);
          else if (p)
            u[l] = [i], g(l) && (h[l] = u[l]);
          else {
            const O = [i];
            w(l, e.k) && (l.value = O), e.k && (u[e.k] = O);
          }
        } else p ? (u[l] = o, g(l) && (h[l] = o)) : R && (w(l, e.k) && (l.value = o), e.k && (u[e.k] = o));
      };
      if (o) {
        const I = () => {
          F(), or.delete(e);
        };
        I.id = -1, or.set(e, I), Ue(I, n);
      } else
        ai(e), F();
    }
  }
}
function ai(e) {
  const t = or.get(e);
  t && (t.flags |= 8, or.delete(e));
}
xr().requestIdleCallback;
xr().cancelIdleCallback;
const bn = (e) => !!e.type.__asyncLoader, Zl = (e) => e.type.__isKeepAlive;
function Hl(e, t, n = je, r = !1) {
  if (n) {
    const s = n[e] || (n[e] = []), i = t.__weh || (t.__weh = (...o) => {
      Bt();
      const a = Us(n), l = ut(t, n, e, o);
      return a(), kt(), l;
    });
    return r ? s.unshift(i) : s.push(i), i;
  }
}
const Rs = (e) => (t, n = je) => {
  (!Mn || e === "sp") && Hl(e, (...r) => t(...r), n);
}, sn = Rs("m"), zl = Rs(
  "bum"
), Yn = Rs("um"), Xl = /* @__PURE__ */ Symbol.for("v-ndc");
function It(e, t, n, r) {
  let s;
  const i = n, o = H(e);
  if (o || ve(e)) {
    const a = o && /* @__PURE__ */ Kt(e);
    let l = !1, c = !1;
    a && (l = !/* @__PURE__ */ Le(e), c = /* @__PURE__ */ Vt(e), e = Vr(e)), s = new Array(e.length);
    for (let u = 0, h = e.length; u < h; u++)
      s[u] = t(
        l ? c ? nn(_e(e[u])) : _e(e[u]) : e[u],
        u,
        void 0,
        i
      );
  } else if (typeof e == "number") {
    s = new Array(e);
    for (let a = 0; a < e; a++)
      s[a] = t(a + 1, a, void 0, i);
  } else if (he(e))
    if (e[Symbol.iterator])
      s = Array.from(
        e,
        (a, l) => t(a, l, void 0, i)
      );
    else {
      const a = Object.keys(e);
      s = new Array(a.length);
      for (let l = 0, c = a.length; l < c; l++) {
        const u = a[l];
        s[l] = t(e[u], u, l, i);
      }
    }
  else
    s = [];
  return s;
}
const ns = (e) => e ? _o(e) ? Fr(e) : ns(e.parent) : null, An = (
  // Move PURE marker to new line to workaround compiler discarding it
  // due to type annotation
  /* @__PURE__ */ Fe(/* @__PURE__ */ Object.create(null), {
    $: (e) => e,
    $el: (e) => e.vnode.el,
    $data: (e) => e.data,
    $props: (e) => e.props,
    $attrs: (e) => e.attrs,
    $slots: (e) => e.slots,
    $refs: (e) => e.refs,
    $parent: (e) => ns(e.parent),
    $root: (e) => ns(e.root),
    $host: (e) => e.ce,
    $emit: (e) => e.emit,
    $options: (e) => e.type,
    $forceUpdate: (e) => e.f || (e.f = () => {
      Ms(e.update);
    }),
    $nextTick: (e) => e.n || (e.n = qe.bind(e.proxy)),
    $watch: (e) => Pt
  })
), Wr = (e, t) => e !== de && !e.__isScriptSetup && ie(e, t), _l = {
  get({ _: e }, t) {
    if (t === "__v_skip")
      return !0;
    const { ctx: n, setupState: r, data: s, props: i, accessCache: o, type: a, appContext: l } = e;
    if (t[0] !== "$") {
      const m = o[t];
      if (m !== void 0)
        switch (m) {
          case 1:
            return r[t];
          case 2:
            return s[t];
          case 4:
            return n[t];
          case 3:
            return i[t];
        }
      else {
        if (Wr(r, t))
          return o[t] = 1, r[t];
        if (ie(i, t))
          return o[t] = 3, i[t];
        if (n !== de && ie(n, t))
          return o[t] = 4, n[t];
        o[t] = 0;
      }
    }
    const c = An[t];
    let u, h;
    if (c)
      return t === "$attrs" && Be(e.attrs, "get", ""), c(e);
    if (
      // css module (injected by vue-loader)
      (u = a.__cssModules) && (u = u[t])
    )
      return u;
    if (n !== de && ie(n, t))
      return o[t] = 4, n[t];
    if (
      // global properties
      h = l.config.globalProperties, ie(h, t)
    )
      return h[t];
  },
  set({ _: e }, t, n) {
    const { data: r, setupState: s, ctx: i } = e;
    return Wr(s, t) ? (s[t] = n, !0) : ie(e.props, t) || t[0] === "$" && t.slice(1) in e ? !1 : (i[t] = n, !0);
  },
  has({
    _: { data: e, setupState: t, accessCache: n, ctx: r, appContext: s, props: i, type: o }
  }, a) {
    let l;
    return !!(n[a] || Wr(t, a) || ie(i, a) || ie(r, a) || ie(An, a) || ie(s.config.globalProperties, a) || (l = o.__cssModules) && l[a]);
  },
  defineProperty(e, t, n) {
    return n.get != null ? e._.accessCache[t] = 0 : ie(n, "value") && this.set(e, t, n.value, null), Reflect.defineProperty(e, t, n);
  }
};
function Uo() {
  return {
    app: null,
    config: {
      isNativeTag: Xi,
      performance: !1,
      globalProperties: {},
      optionMergeStrategies: {},
      errorHandler: void 0,
      warnHandler: void 0,
      compilerOptions: {}
    },
    mixins: [],
    components: {},
    directives: {},
    provides: /* @__PURE__ */ Object.create(null),
    optionsCache: /* @__PURE__ */ new WeakMap(),
    propsCache: /* @__PURE__ */ new WeakMap(),
    emitsCache: /* @__PURE__ */ new WeakMap()
  };
}
let $l = 0;
function ec(e, t) {
  return function(r, s = null) {
    le(r) || (r = Fe({}, r)), s != null && !he(s) && (s = null);
    const i = Uo(), o = /* @__PURE__ */ new WeakSet(), a = [];
    let l = !1;
    const c = i.app = {
      _uid: $l++,
      _component: r,
      _props: s,
      _container: null,
      _context: i,
      _instance: null,
      version: Rc,
      get config() {
        return i.config;
      },
      set config(u) {
      },
      use(u, ...h) {
        return o.has(u) || (u && le(u.install) ? (o.add(u), u.install(c, ...h)) : le(u) && (o.add(u), u(c, ...h))), c;
      },
      mixin(u) {
        return c;
      },
      component(u, h) {
        return h ? (i.components[u] = h, c) : i.components[u];
      },
      directive(u, h) {
        return h ? (i.directives[u] = h, c) : i.directives[u];
      },
      mount(u, h, m) {
        if (!l) {
          const g = c._ceVNode || J(r, s);
          return g.appContext = i, m === !0 ? m = "svg" : m === !1 && (m = void 0), e(g, u, m), l = !0, c._container = u, u.__vue_app__ = c, Fr(g.component);
        }
      },
      onUnmount(u) {
        a.push(u);
      },
      unmount() {
        l && (ut(
          a,
          c._instance,
          16
        ), e(null, c._container), delete c._container.__vue_app__);
      },
      provide(u, h) {
        return i.provides[u] = h, c;
      },
      runWithContext(u) {
        const h = Nt;
        Nt = c;
        try {
          return u();
        } finally {
          Nt = h;
        }
      }
    };
    return c;
  };
}
let Nt = null;
const tc = (e, t) => t === "modelValue" || t === "model-value" ? e.modelModifiers : e[`${t}Modifiers`] || e[`${Ge(t)}Modifiers`] || e[`${Pe(t)}Modifiers`];
function nc(e, t, ...n) {
  if (e.isUnmounted) return;
  const r = e.vnode.props || de;
  let s = n;
  const i = t.startsWith("update:"), o = i && tc(r, t.slice(7));
  o && (o.trim && (s = n.map((u) => ve(u) ? u.trim() : u)), o.number && (s = n.map(As)));
  let a, l = r[a = Yr(t)] || // also try camelCase event handler (#2249)
  r[a = Yr(Ge(t))];
  !l && i && (l = r[a = Yr(Pe(t))]), l && ut(
    l,
    e,
    6,
    s
  );
  const c = r[a + "Once"];
  if (c) {
    if (!e.emitted)
      e.emitted = {};
    else if (e.emitted[a])
      return;
    e.emitted[a] = !0, ut(
      c,
      e,
      6,
      s
    );
  }
}
function rc(e, t, n = !1) {
  const r = t.emitsCache, s = r.get(e);
  if (s !== void 0)
    return s;
  const i = e.emits;
  let o = {};
  return i ? (H(i) ? i.forEach((a) => o[a] = null) : Fe(o, i), he(e) && r.set(e, o), o) : (he(e) && r.set(e, null), null);
}
function kr(e, t) {
  return !e || !vr(t) ? !1 : (t = t.slice(2), t = t === "Once" ? t : t.replace(/Once$/, ""), ie(e, t[0].toLowerCase() + t.slice(1)) || ie(e, Pe(t)) || ie(e, t));
}
function li(e) {
  const {
    type: t,
    vnode: n,
    proxy: r,
    withProxy: s,
    propsOptions: [i],
    slots: o,
    attrs: a,
    emit: l,
    render: c,
    renderCache: u,
    props: h,
    data: m,
    setupState: g,
    ctx: w,
    inheritAttrs: p
  } = e, R = ir(e);
  let F, I;
  try {
    if (n.shapeFlag & 4) {
      const E = s || r, b = E;
      F = at(
        c.call(
          b,
          E,
          u,
          h,
          g,
          m,
          w
        )
      ), I = a;
    } else {
      const E = t;
      F = at(
        E.length > 1 ? E(
          h,
          { attrs: a, slots: o, emit: l }
        ) : E(
          h,
          null
        )
      ), I = t.props ? a : sc(a);
    }
  } catch (E) {
    Lt.length = 0, Mr(E, e, 1), F = J(Rt);
  }
  let O = F;
  if (I && p !== !1) {
    const E = Object.keys(I), { shapeFlag: b } = O;
    E.length && b & 7 && (i && E.some(yr) && (I = ic(
      I,
      i
    )), O = qt(O, I, !1, !0));
  }
  return n.dirs && (O = qt(O, null, !1, !0), O.dirs = O.dirs ? O.dirs.concat(n.dirs) : n.dirs), n.transition && ks(O, n.transition), F = O, ir(R), F;
}
const sc = (e) => {
  let t;
  for (const n in e)
    (n === "class" || n === "style" || vr(n)) && ((t || (t = {}))[n] = e[n]);
  return t;
}, ic = (e, t) => {
  const n = {};
  for (const r in e)
    (!yr(r) || !(r.slice(9) in t)) && (n[r] = e[r]);
  return n;
};
function oc(e, t, n) {
  const { props: r, children: s, component: i } = e, { props: o, children: a, patchFlag: l } = t, c = i.emitsOptions;
  if (t.dirs || t.transition)
    return !0;
  if (n && l >= 0) {
    if (l & 1024)
      return !0;
    if (l & 16)
      return r ? ci(r, o, c) : !!o;
    if (l & 8) {
      const u = t.dynamicProps;
      for (let h = 0; h < u.length; h++) {
        const m = u[h];
        if (Oo(o, r, m) && !kr(c, m))
          return !0;
      }
    }
  } else
    return (s || a) && (!a || !a.$stable) ? !0 : r === o ? !1 : r ? o ? ci(r, o, c) : !0 : !!o;
  return !1;
}
function ci(e, t, n) {
  const r = Object.keys(t);
  if (r.length !== Object.keys(e).length)
    return !0;
  for (let s = 0; s < r.length; s++) {
    const i = r[s];
    if (Oo(t, e, i) && !kr(n, i))
      return !0;
  }
  return !1;
}
function Oo(e, t, n) {
  const r = e[n], s = t[n];
  return n === "style" && he(r) && he(s) ? !xs(r, s) : r !== s;
}
function ac({ vnode: e, parent: t, suspense: n }, r) {
  for (; t; ) {
    const s = t.subTree;
    if (s.suspense && s.suspense.activeBranch === e && (s.suspense.vnode.el = s.el = r, e = s), s === e)
      (e = t.vnode).el = r, t = t.parent;
    else
      break;
  }
  n && n.activeBranch === e && (n.vnode.el = r);
}
const Go = {}, To = () => Object.create(Go), Yo = (e) => Object.getPrototypeOf(e) === Go;
function lc(e, t, n, r = !1) {
  const s = {}, i = To();
  e.propsDefaults = /* @__PURE__ */ Object.create(null), Po(e, t, s, i);
  for (const o in e.propsOptions[0])
    o in s || (s[o] = void 0);
  n ? e.props = r ? s : /* @__PURE__ */ Is(s) : e.type.props ? e.props = s : e.props = i, e.attrs = i;
}
function cc(e, t, n, r) {
  const {
    props: s,
    attrs: i,
    vnode: { patchFlag: o }
  } = e, a = /* @__PURE__ */ ne(s), [l] = e.propsOptions;
  let c = !1;
  if (
    // always force full diff in dev
    // - #1942 if hmr is enabled with sfc component
    // - vite#872 non-sfc component used by sfc component
    (r || o > 0) && !(o & 16)
  ) {
    if (o & 8) {
      const u = e.vnode.dynamicProps;
      for (let h = 0; h < u.length; h++) {
        let m = u[h];
        if (kr(e.emitsOptions, m))
          continue;
        const g = t[m];
        if (l)
          if (ie(i, m))
            g !== i[m] && (i[m] = g, c = !0);
          else {
            const w = Ge(m);
            s[w] = rs(
              l,
              a,
              w,
              g,
              e,
              !1
            );
          }
        else
          g !== i[m] && (i[m] = g, c = !0);
      }
    }
  } else {
    Po(e, t, s, i) && (c = !0);
    let u;
    for (const h in a)
      (!t || // for camelCase
      !ie(t, h) && // it's possible the original props was passed in as kebab-case
      // and converted to camelCase (#955)
      ((u = Pe(h)) === h || !ie(t, u))) && (l ? n && // for camelCase
      (n[h] !== void 0 || // for kebab-case
      n[u] !== void 0) && (s[h] = rs(
        l,
        a,
        h,
        void 0,
        e,
        !0
      )) : delete s[h]);
    if (i !== a)
      for (const h in i)
        (!t || !ie(t, h)) && (delete i[h], c = !0);
  }
  c && mt(e.attrs, "set", "");
}
function Po(e, t, n, r) {
  const [s, i] = e.propsOptions;
  let o = !1, a;
  if (t)
    for (let l in t) {
      if (mn(l))
        continue;
      const c = t[l];
      let u;
      s && ie(s, u = Ge(l)) ? !i || !i.includes(u) ? n[u] = c : (a || (a = {}))[u] = c : kr(e.emitsOptions, l) || (!(l in r) || c !== r[l]) && (r[l] = c, o = !0);
    }
  if (i) {
    const l = /* @__PURE__ */ ne(n), c = a || de;
    for (let u = 0; u < i.length; u++) {
      const h = i[u];
      n[h] = rs(
        s,
        l,
        h,
        c[h],
        e,
        !ie(c, h)
      );
    }
  }
  return o;
}
function rs(e, t, n, r, s, i) {
  const o = e[n];
  if (o != null) {
    const a = ie(o, "default");
    if (a && r === void 0) {
      const l = o.default;
      if (o.type !== Function && !o.skipFactory && le(l)) {
        const { propsDefaults: c } = s;
        if (n in c)
          r = c[n];
        else {
          const u = Us(s);
          r = c[n] = l.call(
            null,
            t
          ), u();
        }
      } else
        r = l;
      s.ce && s.ce._setProp(n, r);
    }
    o[
      0
      /* shouldCast */
    ] && (i && !a ? r = !1 : o[
      1
      /* shouldCastTrue */
    ] && (r === "" || r === Pe(n)) && (r = !0));
  }
  return r;
}
function uc(e, t, n = !1) {
  const r = t.propsCache, s = r.get(e);
  if (s)
    return s;
  const i = e.props, o = {}, a = [];
  if (!i)
    return he(e) && r.set(e, _t), _t;
  if (H(i))
    for (let c = 0; c < i.length; c++) {
      const u = Ge(i[c]);
      ui(u) && (o[u] = de);
    }
  else if (i)
    for (const c in i) {
      const u = Ge(c);
      if (ui(u)) {
        const h = i[c], m = o[u] = H(h) || le(h) ? { type: h } : Fe({}, h), g = m.type;
        let w = !1, p = !0;
        if (H(g))
          for (let R = 0; R < g.length; ++R) {
            const F = g[R], I = le(F) && F.name;
            if (I === "Boolean") {
              w = !0;
              break;
            } else I === "String" && (p = !1);
          }
        else
          w = le(g) && g.name === "Boolean";
        m[
          0
          /* shouldCast */
        ] = w, m[
          1
          /* shouldCastTrue */
        ] = p, (w || ie(m, "default")) && a.push(u);
      }
    }
  const l = [o, a];
  return he(e) && r.set(e, l), l;
}
function ui(e) {
  return e[0] !== "$" && !mn(e);
}
const Fs = (e) => e === "_" || e === "_ctx" || e === "$stable", Qs = (e) => H(e) ? e.map(at) : [at(e)], fc = (e, t, n) => {
  if (t._n)
    return t;
  const r = Xn((...s) => Qs(t(...s)), n);
  return r._c = !1, r;
}, jo = (e, t, n) => {
  const r = e._ctx;
  for (const s in e) {
    if (Fs(s)) continue;
    const i = e[s];
    if (le(i))
      t[s] = fc(s, i, r);
    else if (i != null) {
      const o = Qs(i);
      t[s] = () => o;
    }
  }
}, Ko = (e, t) => {
  const n = Qs(t);
  e.slots.default = () => n;
}, No = (e, t, n) => {
  for (const r in t)
    (n || !Fs(r)) && (e[r] = t[r]);
}, hc = (e, t, n) => {
  const r = e.slots = To();
  if (e.vnode.shapeFlag & 32) {
    const s = t._;
    s ? (No(r, t, n), n && ro(r, "_", s, !0)) : jo(t, r);
  } else t && Ko(e, t);
}, dc = (e, t, n) => {
  const { vnode: r, slots: s } = e;
  let i = !0, o = de;
  if (r.shapeFlag & 32) {
    const a = t._;
    a ? n && a === 1 ? i = !1 : No(s, t, n) : (i = !t.$stable, jo(t, s)), o = t;
  } else t && (Ko(e, t), o = { default: 1 });
  if (i)
    for (const a in s)
      !Fs(a) && o[a] == null && delete s[a];
}, Ue = yc;
function pc(e) {
  return gc(e);
}
function gc(e, t) {
  const n = xr();
  n.__VUE__ = !0;
  const {
    insert: r,
    remove: s,
    patchProp: i,
    createElement: o,
    createText: a,
    createComment: l,
    setText: c,
    setElementText: u,
    parentNode: h,
    nextSibling: m,
    setScopeId: g = Pt,
    insertStaticContent: w
  } = e, p = (f, d, v, S = null, V = null, A = null, Q = void 0, k = null, B = !!d.dynamicChildren) => {
    if (f === d)
      return;
    f && !hn(f, d) && (S = jn(f), K(f, V, A, !0), f = null), d.patchFlag === -2 && (B = !1, d.dynamicChildren = null);
    const { type: x, ref: N, shapeFlag: G } = d;
    switch (x) {
      case Rr:
        R(f, d, v, S);
        break;
      case Rt:
        F(f, d, v, S);
        break;
      case _n:
        f == null && I(d, v, S, Q);
        break;
      case ge:
        De(
          f,
          d,
          v,
          S,
          V,
          A,
          Q,
          k,
          B
        );
        break;
      default:
        G & 1 ? b(
          f,
          d,
          v,
          S,
          V,
          A,
          Q,
          k,
          B
        ) : G & 6 ? me(
          f,
          d,
          v,
          S,
          V,
          A,
          Q,
          k,
          B
        ) : (G & 64 || G & 128) && x.process(
          f,
          d,
          v,
          S,
          V,
          A,
          Q,
          k,
          B,
          cn
        );
    }
    N != null && V ? wn(N, f && f.ref, A, d || f, !d) : N == null && f && f.ref != null && wn(f.ref, null, A, f, !0);
  }, R = (f, d, v, S) => {
    if (f == null)
      r(
        d.el = a(d.children),
        v,
        S
      );
    else {
      const V = d.el = f.el;
      d.children !== f.children && c(V, d.children);
    }
  }, F = (f, d, v, S) => {
    f == null ? r(
      d.el = l(d.children || ""),
      v,
      S
    ) : d.el = f.el;
  }, I = (f, d, v, S) => {
    [f.el, f.anchor] = w(
      f.children,
      d,
      v,
      S,
      f.el,
      f.anchor
    );
  }, O = ({ el: f, anchor: d }, v, S) => {
    let V;
    for (; f && f !== d; )
      V = m(f), r(f, v, S), f = V;
    r(d, v, S);
  }, E = ({ el: f, anchor: d }) => {
    let v;
    for (; f && f !== d; )
      v = m(f), s(f), f = v;
    s(d);
  }, b = (f, d, v, S, V, A, Q, k, B) => {
    if (d.type === "svg" ? Q = "svg" : d.type === "math" && (Q = "mathml"), f == null)
      C(
        d,
        v,
        S,
        V,
        A,
        Q,
        k,
        B
      );
    else {
      const x = f.el && f.el._isVueCE ? f.el : null;
      try {
        x && x._beginPatch(), $(
          f,
          d,
          V,
          A,
          Q,
          k,
          B
        );
      } finally {
        x && x._endPatch();
      }
    }
  }, C = (f, d, v, S, V, A, Q, k) => {
    let B, x;
    const { props: N, shapeFlag: G, transition: P, dirs: q } = f;
    if (B = f.el = o(
      f.type,
      A,
      N && N.is,
      N
    ), G & 8 ? u(B, f.children) : G & 16 && T(
      f.children,
      B,
      null,
      S,
      V,
      qr(f, A),
      Q,
      k
    ), q && Ut(f, null, S, "created"), M(B, f, f.scopeId, Q, S), N) {
      for (const ae in N)
        ae !== "value" && !mn(ae) && i(B, ae, null, N[ae], A, S);
      "value" in N && i(B, "value", null, N.value, A), (x = N.onVnodeBeforeMount) && st(x, S, f);
    }
    q && Ut(f, null, S, "beforeMount");
    const te = mc(V, P);
    te && P.beforeEnter(B), r(B, d, v), ((x = N && N.onVnodeMounted) || te || q) && Ue(() => {
      x && st(x, S, f), te && P.enter(B), q && Ut(f, null, S, "mounted");
    }, V);
  }, M = (f, d, v, S, V) => {
    if (v && g(f, v), S)
      for (let A = 0; A < S.length; A++)
        g(f, S[A]);
    if (V) {
      let A = V.subTree;
      if (d === A || Jo(A.type) && (A.ssContent === d || A.ssFallback === d)) {
        const Q = V.vnode;
        M(
          f,
          Q,
          Q.scopeId,
          Q.slotScopeIds,
          V.parent
        );
      }
    }
  }, T = (f, d, v, S, V, A, Q, k, B = 0) => {
    for (let x = B; x < f.length; x++) {
      const N = f[x] = k ? gt(f[x]) : at(f[x]);
      p(
        null,
        N,
        d,
        v,
        S,
        V,
        A,
        Q,
        k
      );
    }
  }, $ = (f, d, v, S, V, A, Q) => {
    const k = d.el = f.el;
    let { patchFlag: B, dynamicChildren: x, dirs: N } = d;
    B |= f.patchFlag & 16;
    const G = f.props || de, P = d.props || de;
    let q;
    if (v && Ot(v, !1), (q = P.onVnodeBeforeUpdate) && st(q, v, d, f), N && Ut(d, f, v, "beforeUpdate"), v && Ot(v, !0), // #6385 the old vnode may be a user-wrapped non-isomorphic block
    // Force full diff when block metadata is unstable.
    x && (!f.dynamicChildren || f.dynamicChildren.length !== x.length) && (B = 0, Q = !1, x = null), (G.innerHTML && P.innerHTML == null || G.textContent && P.textContent == null) && u(k, ""), x ? _(
      f.dynamicChildren,
      x,
      k,
      v,
      S,
      qr(d, V),
      A
    ) : Q || re(
      f,
      d,
      k,
      null,
      v,
      S,
      qr(d, V),
      A,
      !1
    ), B > 0) {
      if (B & 16)
        pe(k, G, P, v, V);
      else if (B & 2 && G.class !== P.class && i(k, "class", null, P.class, V), B & 4 && i(k, "style", G.style, P.style, V), B & 8) {
        const te = d.dynamicProps;
        for (let ae = 0; ae < te.length; ae++) {
          const se = te[ae], we = G[se], Ie = P[se];
          (Ie !== we || se === "value") && i(k, se, we, Ie, V, v);
        }
      }
      B & 1 && f.children !== d.children && u(k, d.children);
    } else !Q && x == null && pe(k, G, P, v, V);
    ((q = P.onVnodeUpdated) || N) && Ue(() => {
      q && st(q, v, d, f), N && Ut(d, f, v, "updated");
    }, S);
  }, _ = (f, d, v, S, V, A, Q) => {
    for (let k = 0; k < d.length; k++) {
      const B = f[k], x = d[k], N = (
        // oldVNode may be an errored async setup() component inside Suspense
        // which will not have a mounted element
        B.el && // - In the case of a Fragment, we need to provide the actual parent
        // of the Fragment itself so it can move its children.
        (B.type === ge || // - In the case of different nodes, there is going to be a replacement
        // which also requires the correct parent container
        !hn(B, x) || // - In the case of a component, it could contain anything.
        B.shapeFlag & 198) ? h(B.el) : (
          // In other cases, the parent container is not actually used so we
          // just pass the block element here to avoid a DOM parentNode call.
          v
        )
      );
      p(
        B,
        x,
        N,
        null,
        S,
        V,
        A,
        Q,
        !0
      );
    }
  }, pe = (f, d, v, S, V) => {
    if (d !== v) {
      if (d !== de)
        for (const A in d)
          !mn(A) && !(A in v) && i(
            f,
            A,
            d[A],
            null,
            V,
            S
          );
      for (const A in v) {
        if (mn(A)) continue;
        const Q = v[A], k = d[A];
        Q !== k && A !== "value" && i(f, A, k, Q, V, S);
      }
      "value" in v && i(f, "value", d.value, v.value, V);
    }
  }, De = (f, d, v, S, V, A, Q, k, B) => {
    const x = d.el = f ? f.el : a(""), N = d.anchor = f ? f.anchor : a("");
    let { patchFlag: G, dynamicChildren: P, slotScopeIds: q } = d;
    q && (k = k ? k.concat(q) : q), f == null ? (r(x, v, S), r(N, v, S), T(
      // #10007
      // such fragment like `<></>` will be compiled into
      // a fragment which doesn't have a children.
      // In this case fallback to an empty array
      d.children || [],
      v,
      N,
      V,
      A,
      Q,
      k,
      B
    )) : G > 0 && G & 64 && P && // #2715 the previous fragment could've been a BAILed one as a result
    // of renderSlot() with no valid children
    f.dynamicChildren && f.dynamicChildren.length === P.length ? (_(
      f.dynamicChildren,
      P,
      v,
      V,
      A,
      Q,
      k
    ), // #2080 if the stable fragment has a key, it's a <template v-for> that may
    //  get moved around. Make sure all root level vnodes inherit el.
    // #2134 or if it's a component root, it may also get moved around
    // as the component is being moved.
    (d.key != null || V && d === V.subTree) && Lo(
      f,
      d,
      !0
      /* shallow */
    )) : re(
      f,
      d,
      v,
      N,
      V,
      A,
      Q,
      k,
      B
    );
  }, me = (f, d, v, S, V, A, Q, k, B) => {
    d.slotScopeIds = k, f == null ? d.shapeFlag & 512 ? V.ctx.activate(
      d,
      v,
      S,
      Q,
      B
    ) : ye(
      d,
      v,
      S,
      V,
      A,
      Q,
      B
    ) : Ee(f, d, B);
  }, ye = (f, d, v, S, V, A, Q) => {
    const k = f.component = Sc(
      f,
      S,
      V
    );
    if (Zl(f) && (k.ctx.renderer = cn), Ec(k, !1, Q), k.asyncDep) {
      if (V && V.registerDep(k, X, Q), !f.el) {
        const B = k.subTree = J(Rt);
        F(null, B, d, v), f.placeholder = B.el;
      }
    } else
      X(
        k,
        f,
        d,
        v,
        V,
        A,
        Q
      );
  }, Ee = (f, d, v) => {
    const S = d.component = f.component;
    if (oc(f, d, v))
      if (S.asyncDep && !S.asyncResolved) {
        Z(S, d, v);
        return;
      } else
        S.next = d, S.update();
    else
      d.el = f.el, S.vnode = d;
  }, X = (f, d, v, S, V, A, Q) => {
    const k = () => {
      if (f.isMounted) {
        let { next: G, bu: P, u: q, parent: te, vnode: ae } = f;
        {
          const nt = Wo(f);
          if (nt) {
            G && (G.el = ae.el, Z(f, G, Q)), nt.asyncDep.then(() => {
              Ue(() => {
                f.isUnmounted || x();
              }, V);
            });
            return;
          }
        }
        let se = G, we;
        Ot(f, !1), G ? (G.el = ae.el, Z(f, G, Q)) : G = ae, P && zn(P), (we = G.props && G.props.onVnodeBeforeUpdate) && st(we, te, G, ae), Ot(f, !0);
        const Ie = li(f), tt = f.subTree;
        f.subTree = Ie, p(
          tt,
          Ie,
          // parent may have changed if it's in a teleport
          h(tt.el),
          // anchor may have changed if it's in a fragment
          jn(tt),
          f,
          V,
          A
        ), G.el = Ie.el, se === null && ac(f, Ie.el), q && Ue(q, V), (we = G.props && G.props.onVnodeUpdated) && Ue(
          () => st(we, te, G, ae),
          V
        );
      } else {
        let G;
        const { el: P, props: q } = d, { bm: te, m: ae, parent: se, root: we, type: Ie } = f, tt = bn(d);
        Ot(f, !1), te && zn(te), !tt && (G = q && q.onVnodeBeforeMount) && st(G, se, d), Ot(f, !0);
        {
          we.ce && we.ce._hasShadowRoot() && we.ce._injectChildStyle(
            Ie,
            f.parent ? f.parent.type : void 0
          );
          const nt = f.subTree = li(f);
          p(
            null,
            nt,
            v,
            S,
            f,
            V,
            A
          ), d.el = nt.el;
        }
        if (ae && Ue(ae, V), !tt && (G = q && q.onVnodeMounted)) {
          const nt = d;
          Ue(
            () => st(G, se, nt),
            V
          );
        }
        (d.shapeFlag & 256 || se && bn(se.vnode) && se.vnode.shapeFlag & 256) && f.a && Ue(f.a, V), f.isMounted = !0, d = v = S = null;
      }
    };
    f.scope.on();
    const B = f.effect = new lo(k);
    f.scope.off();
    const x = f.update = B.run.bind(B), N = f.job = B.runIfDirty.bind(B);
    N.i = f, N.id = f.uid, B.scheduler = () => Ms(N), Ot(f, !0), x();
  }, Z = (f, d, v) => {
    d.component = f;
    const S = f.vnode.props;
    f.vnode = d, f.next = null, cc(f, d.props, S, v), dc(f, d.children, v), Bt(), ii(f), kt();
  }, re = (f, d, v, S, V, A, Q, k, B = !1) => {
    const x = f && f.children, N = f ? f.shapeFlag : 0, G = d.children, { patchFlag: P, shapeFlag: q } = d;
    if (P > 0) {
      if (P & 128) {
        ce(
          x,
          G,
          v,
          S,
          V,
          A,
          Q,
          k,
          B
        );
        return;
      } else if (P & 256) {
        fe(
          x,
          G,
          v,
          S,
          V,
          A,
          Q,
          k,
          B
        );
        return;
      }
    }
    q & 8 ? (N & 16 && ln(x, V, A), G !== x && u(v, G)) : N & 16 ? q & 16 ? ce(
      x,
      G,
      v,
      S,
      V,
      A,
      Q,
      k,
      B
    ) : ln(x, V, A, !0) : (N & 8 && u(v, ""), q & 16 && T(
      G,
      v,
      S,
      V,
      A,
      Q,
      k,
      B
    ));
  }, fe = (f, d, v, S, V, A, Q, k, B) => {
    f = f || _t, d = d || _t;
    const x = f.length, N = d.length, G = Math.min(x, N);
    let P;
    for (P = 0; P < G; P++) {
      const q = d[P] = B ? gt(d[P]) : at(d[P]);
      p(
        f[P],
        q,
        v,
        null,
        V,
        A,
        Q,
        k,
        B
      );
    }
    x > N ? ln(
      f,
      V,
      A,
      !0,
      !1,
      G
    ) : T(
      d,
      v,
      S,
      V,
      A,
      Q,
      k,
      B,
      G
    );
  }, ce = (f, d, v, S, V, A, Q, k, B) => {
    let x = 0;
    const N = d.length;
    let G = f.length - 1, P = N - 1;
    for (; x <= G && x <= P; ) {
      const q = f[x], te = d[x] = B ? gt(d[x]) : at(d[x]);
      if (hn(q, te))
        p(
          q,
          te,
          v,
          null,
          V,
          A,
          Q,
          k,
          B
        );
      else
        break;
      x++;
    }
    for (; x <= G && x <= P; ) {
      const q = f[G], te = d[P] = B ? gt(d[P]) : at(d[P]);
      if (hn(q, te))
        p(
          q,
          te,
          v,
          null,
          V,
          A,
          Q,
          k,
          B
        );
      else
        break;
      G--, P--;
    }
    if (x > G) {
      if (x <= P) {
        const q = P + 1, te = q < N ? d[q].el : S;
        for (; x <= P; )
          p(
            null,
            d[x] = B ? gt(d[x]) : at(d[x]),
            v,
            te,
            V,
            A,
            Q,
            k,
            B
          ), x++;
      }
    } else if (x > P)
      for (; x <= G; )
        K(f[x], V, A, !0), x++;
    else {
      const q = x, te = x, ae = /* @__PURE__ */ new Map();
      for (x = te; x <= P; x++) {
        const Te = d[x] = B ? gt(d[x]) : at(d[x]);
        Te.key != null && ae.set(Te.key, x);
      }
      let se, we = 0;
      const Ie = P - te + 1;
      let tt = !1, nt = 0;
      const un = new Array(Ie);
      for (x = 0; x < Ie; x++) un[x] = 0;
      for (x = q; x <= G; x++) {
        const Te = f[x];
        if (we >= Ie) {
          K(Te, V, A, !0);
          continue;
        }
        let rt;
        if (Te.key != null)
          rt = ae.get(Te.key);
        else
          for (se = te; se <= P; se++)
            if (un[se - te] === 0 && hn(Te, d[se])) {
              rt = se;
              break;
            }
        rt === void 0 ? K(Te, V, A, !0) : (un[rt - te] = x + 1, rt >= nt ? nt = rt : tt = !0, p(
          Te,
          d[rt],
          v,
          null,
          V,
          A,
          Q,
          k,
          B
        ), we++);
      }
      const zs = tt ? vc(un) : _t;
      for (se = zs.length - 1, x = Ie - 1; x >= 0; x--) {
        const Te = te + x, rt = d[Te], Xs = d[Te + 1], _s = Te + 1 < N ? (
          // #13559, #14173 fallback to el placeholder for unresolved async component
          Xs.el || qo(Xs)
        ) : S;
        un[x] === 0 ? p(
          null,
          rt,
          v,
          _s,
          V,
          A,
          Q,
          k,
          B
        ) : tt && (se < 0 || x !== zs[se] ? U(rt, v, _s, 2) : se--);
      }
    }
  }, U = (f, d, v, S, V = null) => {
    const { el: A, type: Q, transition: k, children: B, shapeFlag: x } = f;
    if (x & 6) {
      U(f.component.subTree, d, v, S);
      return;
    }
    if (x & 128) {
      f.suspense.move(d, v, S);
      return;
    }
    if (x & 64) {
      Q.move(f, d, v, cn);
      return;
    }
    if (Q === ge) {
      r(A, d, v);
      for (let G = 0; G < B.length; G++)
        U(B[G], d, v, S);
      r(f.anchor, d, v);
      return;
    }
    if (Q === _n) {
      O(f, d, v);
      return;
    }
    if (S !== 2 && x & 1 && k)
      if (S === 0)
        k.persisted && !A[Lr] ? r(A, d, v) : (k.beforeEnter(A), r(A, d, v), Ue(() => k.enter(A), V));
      else {
        const { leave: G, delayLeave: P, afterLeave: q } = k, te = () => {
          f.ctx.isUnmounted ? s(A) : r(A, d, v);
        }, ae = () => {
          const se = A._isLeaving || !!A[Lr];
          A._isLeaving && A[Lr](
            !0
            /* cancelled */
          ), k.persisted && !se ? te() : G(A, () => {
            te(), q && q();
          });
        };
        P ? P(A, te, ae) : ae();
      }
    else
      r(A, d, v);
  }, K = (f, d, v, S = !1, V = !1) => {
    const {
      type: A,
      props: Q,
      ref: k,
      children: B,
      dynamicChildren: x,
      shapeFlag: N,
      patchFlag: G,
      dirs: P,
      cacheIndex: q,
      memo: te
    } = f;
    if (G === -2 && (V = !1), k != null && (Bt(), wn(k, null, v, f, !0), kt()), q != null && (d.renderCache[q] = void 0), N & 256) {
      d.ctx.deactivate(f);
      return;
    }
    const ae = N & 1 && P, se = !bn(f);
    let we;
    if (se && (we = Q && Q.onVnodeBeforeUnmount) && st(we, d, f), N & 6)
      Dt(f.component, v, S);
    else {
      if (N & 128) {
        f.suspense.unmount(v, S);
        return;
      }
      ae && Ut(f, null, d, "beforeUnmount"), N & 64 ? f.type.remove(
        f,
        d,
        v,
        cn,
        S
      ) : x && // #5154
      // when v-once is used inside a block, setBlockTracking(-1) marks the
      // parent block with hasOnce: true
      // so that it doesn't take the fast path during unmount - otherwise
      // components nested in v-once are never unmounted.
      !x.hasOnce && // #1153: fast path should not be taken for non-stable (v-for) fragments
      (A !== ge || G > 0 && G & 64) ? ln(
        x,
        d,
        v,
        !1,
        !0
      ) : (A === ge && G & 384 || !V && N & 16) && ln(B, d, v), S && oe(f);
    }
    const Ie = te != null && q == null;
    (se && (we = Q && Q.onVnodeUnmounted) || ae || Ie) && Ue(() => {
      we && st(we, d, f), ae && Ut(f, null, d, "unmounted"), Ie && (f.el = null);
    }, v);
  }, oe = (f) => {
    const { type: d, el: v, anchor: S, transition: V } = f;
    if (d === ge) {
      ht(v, S);
      return;
    }
    if (d === _n) {
      E(f);
      return;
    }
    const A = () => {
      s(v), V && !V.persisted && V.afterLeave && V.afterLeave();
    };
    if (f.shapeFlag & 1 && V && !V.persisted) {
      const { leave: Q, delayLeave: k } = V, B = () => Q(v, A);
      k ? k(f.el, A, B) : B();
    } else
      A();
  }, ht = (f, d) => {
    let v;
    for (; f !== d; )
      v = m(f), s(f), f = v;
    s(d);
  }, Dt = (f, d, v) => {
    const { bum: S, scope: V, job: A, subTree: Q, um: k, m: B, a: x } = f;
    fi(B), fi(x), S && zn(S), V.stop(), A && (A.flags |= 8, K(Q, f, d, v)), k && Ue(k, d), Ue(() => {
      f.isUnmounted = !0;
    }, d);
  }, ln = (f, d, v, S = !1, V = !1, A = 0) => {
    for (let Q = A; Q < f.length; Q++)
      K(f[Q], d, v, S, V);
  }, jn = (f) => {
    if (f.shapeFlag & 6)
      return jn(f.component.subTree);
    if (f.shapeFlag & 128)
      return f.suspense.next();
    const d = m(f.anchor || f.el), v = d && d[Ll];
    return v ? m(v) : d;
  };
  let Tr = !1;
  const Hs = (f, d, v) => {
    let S;
    f == null ? d._vnode && (K(d._vnode, null, null, !0), S = d._vnode.component) : p(
      d._vnode || null,
      f,
      d,
      null,
      null,
      null,
      v
    ), d._vnode = f, Tr || (Tr = !0, ii(S), Ro(), Tr = !1);
  }, cn = {
    p,
    um: K,
    m: U,
    r: oe,
    mt: ye,
    mc: T,
    pc: re,
    pbc: _,
    n: jn,
    o: e
  };
  return {
    render: Hs,
    hydrate: void 0,
    createApp: ec(Hs)
  };
}
function qr({ type: e, props: t }, n) {
  return n === "svg" && e === "foreignObject" || n === "mathml" && e === "annotation-xml" && t && t.encoding && t.encoding.includes("html") ? void 0 : n;
}
function Ot({ effect: e, job: t }, n) {
  n ? (e.flags |= 32, t.flags |= 4) : (e.flags &= -33, t.flags &= -5);
}
function mc(e, t) {
  return (!e || e && !e.pendingBranch) && t && !t.persisted;
}
function Lo(e, t, n = !1) {
  const r = e.children, s = t.children;
  if (H(r) && H(s))
    for (let i = 0; i < r.length; i++) {
      const o = r[i];
      let a = s[i];
      a.shapeFlag & 1 && !a.dynamicChildren && ((a.patchFlag <= 0 || a.patchFlag === 32) && (a = s[i] = gt(s[i]), a.el = o.el), !n && a.patchFlag !== -2 && Lo(o, a)), a.type === Rr && (a.patchFlag === -1 && (a = s[i] = gt(a)), a.el = o.el), a.type === Rt && !a.el && (a.el = o.el);
    }
}
function vc(e) {
  const t = e.slice(), n = [0];
  let r, s, i, o, a;
  const l = e.length;
  for (r = 0; r < l; r++) {
    const c = e[r];
    if (c !== 0) {
      if (s = n[n.length - 1], e[s] < c) {
        t[r] = s, n.push(r);
        continue;
      }
      for (i = 0, o = n.length - 1; i < o; )
        a = i + o >> 1, e[n[a]] < c ? i = a + 1 : o = a;
      c < e[n[i]] && (i > 0 && (t[r] = n[i - 1]), n[i] = r);
    }
  }
  for (i = n.length, o = n[i - 1]; i-- > 0; )
    n[i] = o, o = t[o];
  return n;
}
function Wo(e) {
  const t = e.subTree.component;
  if (t)
    return t.asyncDep && !t.asyncResolved ? t : Wo(t);
}
function fi(e) {
  if (e)
    for (let t = 0; t < e.length; t++)
      e[t].flags |= 8;
}
function qo(e) {
  if (e.placeholder)
    return e.placeholder;
  const t = e.component;
  return t ? qo(t.subTree) : null;
}
const Jo = (e) => e.__isSuspense;
function yc(e, t) {
  t && t.pendingBranch ? H(e) ? t.effects.push(...e) : t.effects.push(e) : Pl(e);
}
const ge = /* @__PURE__ */ Symbol.for("v-fgt"), Rr = /* @__PURE__ */ Symbol.for("v-txt"), Rt = /* @__PURE__ */ Symbol.for("v-cmt"), _n = /* @__PURE__ */ Symbol.for("v-stc"), Lt = [];
let Ne = null;
function D(e = !1) {
  Lt.push(Ne = e ? null : []);
}
function Zo() {
  Lt.pop(), Ne = Lt[Lt.length - 1] || null;
}
let In = 1;
function ar(e, t = !1) {
  In += e, e < 0 && Ne && t && (Ne.hasOnce = !0);
}
function Ho(e) {
  return e.dynamicChildren = In > 0 ? Ne || _t : null, Zo(), In > 0 && Ne && Ne.push(e), e;
}
function Y(e, t, n, r, s, i) {
  return Ho(
    y(
      e,
      t,
      n,
      r,
      s,
      i,
      !0
    )
  );
}
function yt(e, t, n, r, s) {
  return Ho(
    J(
      e,
      t,
      n,
      r,
      s,
      !0
    )
  );
}
function lr(e) {
  return e ? e.__v_isVNode === !0 : !1;
}
function hn(e, t) {
  return e.type === t.type && e.key === t.key;
}
const zo = ({ key: e }) => e ?? null, $n = ({
  ref: e,
  ref_key: t,
  ref_for: n
}) => (typeof e == "number" && (e = "" + e), e != null ? ve(e) || /* @__PURE__ */ Ce(e) || le(e) ? { i: Je, r: e, k: t, f: !!n } : e : null);
function y(e, t = null, n = null, r = 0, s = null, i = e === ge ? 0 : 1, o = !1, a = !1) {
  const l = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e,
    props: t,
    key: t && zo(t),
    ref: t && $n(t),
    scopeId: Qo,
    slotScopeIds: null,
    children: n,
    component: null,
    suspense: null,
    ssContent: null,
    ssFallback: null,
    dirs: null,
    transition: null,
    el: null,
    anchor: null,
    target: null,
    targetStart: null,
    targetAnchor: null,
    staticCount: 0,
    shapeFlag: i,
    patchFlag: r,
    dynamicProps: s,
    dynamicChildren: null,
    appContext: null,
    ctx: Je
  };
  return a ? (cr(l, n), i & 128 && e.normalize(l)) : n && (l.shapeFlag |= ve(n) ? 8 : 16), In > 0 && // avoid a block node from tracking itself
  !o && // has current parent block
  Ne && // presence of a patch flag indicates this node needs patching on updates.
  // component nodes also should always be patched, because even if the
  // component doesn't need to update, it needs to persist the instance on to
  // the next vnode so that it can be properly unmounted later.
  (l.patchFlag > 0 || i & 6) && // the EVENTS flag is only for hydration and if it is the only flag, the
  // vnode should not be considered dynamic due to handler caching.
  l.patchFlag !== 32 && Ne.push(l), l;
}
const J = wc;
function wc(e, t = null, n = null, r = 0, s = null, i = !1) {
  if ((!e || e === Xl) && (e = Rt), lr(e)) {
    const a = qt(
      e,
      t,
      !0
      /* mergeRef: true */
    );
    return n && cr(a, n), In > 0 && !i && Ne && (a.shapeFlag & 6 ? Ne[Ne.indexOf(e)] = a : Ne.push(a)), a.patchFlag = -2, a;
  }
  if (kc(e) && (e = e.__vccOpts), t) {
    t = bc(t);
    let { class: a, style: l } = t;
    a && !ve(a) && (t.class = be(a)), he(l) && (/* @__PURE__ */ Ir(l) && !H(l) && (l = Fe({}, l)), t.style = Ke(l));
  }
  const o = ve(e) ? 1 : Jo(e) ? 128 : Wl(e) ? 64 : he(e) ? 4 : le(e) ? 2 : 0;
  return y(
    e,
    t,
    n,
    r,
    s,
    o,
    i,
    !0
  );
}
function bc(e) {
  return e ? /* @__PURE__ */ Ir(e) || Yo(e) ? Fe({}, e) : e : null;
}
function qt(e, t, n = !1, r = !1) {
  const { props: s, ref: i, patchFlag: o, children: a, transition: l } = e, c = t ? Xo(s || {}, t) : s, u = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e.type,
    props: c,
    key: c && zo(c),
    ref: t && t.ref ? (
      // #2078 in the case of <component :is="vnode" ref="extra"/>
      // if the vnode itself already has a ref, cloneVNode will need to merge
      // the refs so the single vnode can be set on multiple refs
      n && i ? H(i) ? i.concat($n(t)) : [i, $n(t)] : $n(t)
    ) : i,
    scopeId: e.scopeId,
    slotScopeIds: e.slotScopeIds,
    children: a,
    target: e.target,
    targetStart: e.targetStart,
    targetAnchor: e.targetAnchor,
    staticCount: e.staticCount,
    shapeFlag: e.shapeFlag,
    // if the vnode is cloned with extra props, we can no longer assume its
    // existing patch flag to be reliable and need to add the FULL_PROPS flag.
    // note: preserve flag for fragments since they use the flag for children
    // fast paths only.
    patchFlag: t && e.type !== ge ? o === -1 ? 16 : o | 16 : o,
    dynamicProps: e.dynamicProps,
    dynamicChildren: e.dynamicChildren,
    appContext: e.appContext,
    dirs: e.dirs,
    transition: l,
    // These should technically only be non-null on mounted VNodes. However,
    // they *should* be copied for kept-alive vnodes. So we just always copy
    // them since them being non-null during a mount doesn't affect the logic as
    // they will simply be overwritten.
    component: e.component,
    suspense: e.suspense,
    ssContent: e.ssContent && qt(e.ssContent),
    ssFallback: e.ssFallback && qt(e.ssFallback),
    placeholder: e.placeholder,
    el: e.el,
    anchor: e.anchor,
    ctx: e.ctx,
    ce: e.ce
  };
  return l && r && ks(
    u,
    l.clone(u)
  ), u;
}
function Ac(e = " ", t = 0) {
  return J(Rr, null, e, t);
}
function xc(e, t) {
  const n = J(_n, null, e);
  return n.staticCount = t, n;
}
function Ve(e = "", t = !1) {
  return t ? (D(), yt(Rt, null, e)) : J(Rt, null, e);
}
function at(e) {
  return e == null || typeof e == "boolean" ? J(Rt) : H(e) ? J(
    ge,
    null,
    // #3666, avoid reference pollution when reusing vnode
    e.slice()
  ) : lr(e) ? gt(e) : J(Rr, null, String(e));
}
function gt(e) {
  return e.el === null && e.patchFlag !== -1 || e.memo ? e : qt(e);
}
function cr(e, t) {
  let n = 0;
  const { shapeFlag: r } = e;
  if (t == null)
    t = null;
  else if (H(t))
    n = 16;
  else if (typeof t == "object")
    if (r & 65) {
      const s = t.default;
      s && (s._c && (s._d = !1), cr(e, s()), s._c && (s._d = !0));
      return;
    } else {
      n = 32;
      const s = t._;
      !s && !Yo(t) ? t._ctx = Je : s === 3 && Je && (Je.slots._ === 1 ? t._ = 1 : (t._ = 2, e.patchFlag |= 1024));
    }
  else if (le(t)) {
    if (r & 65) {
      cr(e, { default: t });
      return;
    }
    t = { default: t, _ctx: Je }, n = 32;
  } else
    t = String(t), r & 64 ? (n = 16, t = [Ac(t)]) : n = 8;
  e.children = t, e.shapeFlag |= n;
}
function Xo(...e) {
  const t = {};
  for (let n = 0; n < e.length; n++) {
    const r = e[n];
    for (const s in r)
      if (s === "class")
        t.class !== r.class && (t.class = be([t.class, r.class]));
      else if (s === "style")
        t.style = Ke([t.style, r.style]);
      else if (vr(s)) {
        const i = t[s], o = r[s];
        o && i !== o && !(H(i) && i.includes(o)) ? t[s] = i ? [].concat(i, o) : o : o == null && i == null && // mergeProps({ 'onUpdate:modelValue': undefined }) should not retain
        // the model listener.
        !yr(s) && (t[s] = o);
      } else s !== "" && (t[s] = r[s]);
  }
  return t;
}
function st(e, t, n, r = null) {
  ut(e, t, 7, [
    n,
    r
  ]);
}
const Vc = Uo();
let Cc = 0;
function Sc(e, t, n) {
  const r = e.type, s = (t ? t.appContext : e.appContext) || Vc, i = {
    uid: Cc++,
    vnode: e,
    type: r,
    parent: t,
    appContext: s,
    root: null,
    // to be immediately set
    next: null,
    subTree: null,
    // will be set synchronously right after creation
    effect: null,
    update: null,
    // will be set synchronously right after creation
    job: null,
    scope: new cl(
      !0
      /* detached */
    ),
    render: null,
    proxy: null,
    exposed: null,
    exposeProxy: null,
    withProxy: null,
    provides: t ? t.provides : Object.create(s.provides),
    ids: t ? t.ids : ["", 0, 0],
    accessCache: null,
    renderCache: [],
    // local resolved assets
    components: null,
    directives: null,
    // resolved props and emits options
    propsOptions: uc(r, s),
    emitsOptions: rc(r, s),
    // emit
    emit: null,
    // to be set immediately
    emitted: null,
    // props default value
    propsDefaults: de,
    // inheritAttrs
    inheritAttrs: r.inheritAttrs,
    // state
    ctx: de,
    data: de,
    props: de,
    attrs: de,
    slots: de,
    refs: de,
    setupState: de,
    setupContext: null,
    // suspense related
    suspense: n,
    suspenseId: n ? n.pendingId : 0,
    asyncDep: null,
    asyncResolved: !1,
    // lifecycle hooks
    // not using enums here because it results in computed properties
    isMounted: !1,
    isUnmounted: !1,
    isDeactivated: !1,
    bc: null,
    c: null,
    bm: null,
    m: null,
    bu: null,
    u: null,
    um: null,
    bum: null,
    da: null,
    a: null,
    rtg: null,
    rtc: null,
    ec: null,
    sp: null
  };
  return i.ctx = { _: i }, i.root = t ? t.root : i, i.emit = nc.bind(null, i), e.ce && e.ce(i), i;
}
let je = null;
const Ds = () => je || Je;
let ur, ss;
{
  const e = xr(), t = (n, r) => {
    let s;
    return (s = e[n]) || (s = e[n] = []), s.push(r), (i) => {
      s.length > 1 ? s.forEach((o) => o(i)) : s[0](i);
    };
  };
  ur = t(
    "__VUE_INSTANCE_SETTERS__",
    (n) => je = n
  ), ss = t(
    "__VUE_SSR_SETTERS__",
    (n) => Mn = n
  );
}
const Us = (e) => {
  const t = je;
  return ur(e), e.scope.on(), () => {
    e.scope.off(), ur(t);
  };
}, hi = () => {
  je && je.scope.off(), ur(null);
};
function _o(e) {
  return e.vnode.shapeFlag & 4;
}
let Mn = !1;
function Ec(e, t = !1, n = !1) {
  t && ss(t);
  const { props: r, children: s } = e.vnode, i = _o(e);
  lc(e, r, i, t), hc(e, s, n || t);
  const o = i ? Ic(e, t) : void 0;
  return t && ss(!1), o;
}
function Ic(e, t) {
  const n = e.type;
  e.accessCache = /* @__PURE__ */ Object.create(null), e.proxy = new Proxy(e.ctx, _l);
  const { setup: r } = n;
  if (r) {
    Bt();
    const s = e.setupContext = r.length > 1 ? Bc(e) : null, i = Us(e), o = Tn(
      r,
      e,
      0,
      [
        e.props,
        s
      ]
    ), a = eo(o);
    if (kt(), i(), (a || e.sp) && !bn(e) && Jl(e), a) {
      if (o.then(hi, hi), t)
        return o.then((l) => {
          di(e, l);
        }).catch((l) => {
          Mr(l, e, 0);
        });
      e.asyncDep = o;
    } else
      di(e, o);
  } else
    $o(e);
}
function di(e, t, n) {
  le(t) ? e.type.__ssrInlineRender ? e.ssrRender = t : e.render = t : he(t) && (e.setupState = Io(t)), $o(e);
}
function $o(e, t, n) {
  const r = e.type;
  e.render || (e.render = r.render || Pt);
}
const Mc = {
  get(e, t) {
    return Be(e, "get", ""), e[t];
  }
};
function Bc(e) {
  const t = (n) => {
    e.exposed = n || {};
  };
  return {
    attrs: new Proxy(e.attrs, Mc),
    slots: e.slots,
    emit: e.emit,
    expose: t
  };
}
function Fr(e) {
  return e.exposed ? e.exposeProxy || (e.exposeProxy = new Proxy(Io(Bl(e.exposed)), {
    get(t, n) {
      if (n in t)
        return t[n];
      if (n in An)
        return An[n](e);
    },
    has(t, n) {
      return n in t || n in An;
    }
  })) : e.proxy;
}
function kc(e) {
  return le(e) && "__vccOpts" in e;
}
const j = (e, t) => /* @__PURE__ */ Ul(e, t, Mn);
function ct(e, t, n) {
  try {
    ar(-1);
    const r = arguments.length;
    return r === 2 ? he(t) && !H(t) ? lr(t) ? J(e, null, [t]) : J(e, t) : J(e, null, t) : (r > 3 ? n = Array.prototype.slice.call(arguments, 2) : r === 3 && lr(n) && (n = [n]), J(e, t, n));
  } finally {
    ar(1);
  }
}
const Rc = "3.5.40";
let is;
const pi = typeof window < "u" && window.trustedTypes;
if (pi)
  try {
    is = /* @__PURE__ */ pi.createPolicy("vue", {
      createHTML: (e) => e
    });
  } catch {
  }
const ea = is ? (e) => is.createHTML(e) : (e) => e, Fc = "http://www.w3.org/2000/svg", Qc = "http://www.w3.org/1998/Math/MathML", pt = typeof document < "u" ? document : null, gi = pt && /* @__PURE__ */ pt.createElement("template"), Dc = {
  insert: (e, t, n) => {
    t.insertBefore(e, n || null);
  },
  remove: (e) => {
    const t = e.parentNode;
    t && t.removeChild(e);
  },
  createElement: (e, t, n, r) => {
    const s = t === "svg" ? pt.createElementNS(Fc, e) : t === "mathml" ? pt.createElementNS(Qc, e) : n ? pt.createElement(e, { is: n }) : pt.createElement(e);
    return e === "select" && r && r.multiple != null && s.setAttribute("multiple", r.multiple), s;
  },
  createText: (e) => pt.createTextNode(e),
  createComment: (e) => pt.createComment(e),
  setText: (e, t) => {
    e.nodeValue = t;
  },
  setElementText: (e, t) => {
    e.textContent = t;
  },
  parentNode: (e) => e.parentNode,
  nextSibling: (e) => e.nextSibling,
  querySelector: (e) => pt.querySelector(e),
  setScopeId(e, t) {
    e.setAttribute(t, "");
  },
  // __UNSAFE__
  // Reason: innerHTML.
  // Static content here can only come from compiled templates.
  // As long as the user only uses trusted templates, this is safe.
  insertStaticContent(e, t, n, r, s, i) {
    const o = n ? n.previousSibling : t.lastChild;
    if (s && (s === i || s.nextSibling))
      for (; t.insertBefore(s.cloneNode(!0), n), !(s === i || !(s = s.nextSibling)); )
        ;
    else {
      gi.innerHTML = ea(
        r === "svg" ? `<svg>${e}</svg>` : r === "mathml" ? `<math>${e}</math>` : e
      );
      const a = gi.content;
      if (r === "svg" || r === "mathml") {
        const l = a.firstChild;
        for (; l.firstChild; )
          a.appendChild(l.firstChild);
        a.removeChild(l);
      }
      t.insertBefore(a, n);
    }
    return [
      // first
      o ? o.nextSibling : t.firstChild,
      // last
      n ? n.previousSibling : t.lastChild
    ];
  }
}, Uc = /* @__PURE__ */ Symbol("_vtc");
function Oc(e, t, n) {
  const r = e[Uc];
  r && (t = (t ? [t, ...r] : [...r]).join(" ")), t == null ? e.removeAttribute("class") : n ? e.setAttribute("class", t) : e.className = t;
}
const fr = /* @__PURE__ */ Symbol("_vod"), ta = /* @__PURE__ */ Symbol("_vsh"), na = {
  // used for prop mismatch check during hydration
  name: "show",
  beforeMount(e, { value: t }, { transition: n }) {
    e[fr] = e.style.display === "none" ? "" : e.style.display, n && t ? n.beforeEnter(e) : dn(e, t);
  },
  mounted(e, { value: t }, { transition: n }) {
    n && t && n.enter(e);
  },
  updated(e, { value: t, oldValue: n }, { transition: r }) {
    !t != !n && (r ? t ? (r.beforeEnter(e), dn(e, !0), r.enter(e)) : r.leave(e, () => {
      dn(e, !1);
    }) : dn(e, t));
  },
  beforeUnmount(e, { value: t }) {
    dn(e, t);
  }
};
function dn(e, t) {
  e.style.display = t ? e[fr] : "none", e[ta] = !t;
}
const Gc = /* @__PURE__ */ Symbol(""), Tc = /(?:^|;)\s*display\s*:/;
function Yc(e, t, n) {
  const r = e.style, s = ve(n);
  let i = !1;
  if (n && !s) {
    if (t)
      if (ve(t))
        for (const o of t.split(";")) {
          const a = o.slice(0, o.indexOf(":")).trim();
          n[a] == null && pn(r, a, "");
        }
      else
        for (const o in t)
          n[o] == null && pn(r, o, "");
    for (const o in n) {
      o === "display" && (i = !0);
      const a = n[o];
      a != null ? jc(
        e,
        o,
        !ve(t) && t ? t[o] : void 0,
        a
      ) || pn(r, o, a) : pn(r, o, "");
    }
  } else if (s) {
    if (t !== n) {
      const o = r[Gc];
      o && (n += ";" + o), r.cssText = n, i = Tc.test(n);
    }
  } else t && e.removeAttribute("style");
  fr in e && (e[fr] = i ? r.display : "", e[ta] && (r.display = "none"));
}
const mi = /\s*!important$/;
function pn(e, t, n) {
  if (H(n))
    n.forEach((r) => pn(e, t, r));
  else if (n == null && (n = ""), t.startsWith("--"))
    e.setProperty(t, n);
  else {
    const r = Pc(e, t);
    mi.test(n) ? e.setProperty(
      Pe(r),
      n.replace(mi, ""),
      "important"
    ) : e[r] = n;
  }
}
const vi = ["Webkit", "Moz", "ms"], Jr = {};
function Pc(e, t) {
  const n = Jr[t];
  if (n)
    return n;
  let r = Ge(t);
  if (r !== "filter" && r in e)
    return Jr[t] = r;
  r = no(r);
  for (let s = 0; s < vi.length; s++) {
    const i = vi[s] + r;
    if (i in e)
      return Jr[t] = i;
  }
  return t;
}
function jc(e, t, n, r) {
  return e.tagName === "TEXTAREA" && (t === "width" || t === "height") && ve(r) && n === r;
}
const yi = "http://www.w3.org/1999/xlink";
function wi(e, t, n, r, s, i = al(t)) {
  r && t.startsWith("xlink:") ? n == null ? e.removeAttributeNS(yi, t.slice(6, t.length)) : e.setAttributeNS(yi, t, n) : n == null || i && !so(n) ? e.removeAttribute(t) : e.setAttribute(
    t,
    i ? "" : Ze(n) ? String(n) : n
  );
}
function bi(e, t, n, r, s) {
  if (t === "innerHTML" || t === "textContent") {
    n != null && (e[t] = t === "innerHTML" ? ea(n) : n);
    return;
  }
  const i = e.tagName;
  if (t === "value" && i !== "PROGRESS" && // custom elements may use _value internally
  !i.includes("-")) {
    const a = i === "OPTION" ? e.getAttribute("value") || "" : e.value, l = n == null ? (
      // #11647: value should be set as empty string for null and undefined,
      // but <input type="checkbox"> should be set as 'on'.
      e.type === "checkbox" ? "on" : ""
    ) : String(n);
    (a !== l || !("_value" in e)) && (e.value = l), n == null && e.removeAttribute(t), e._value = n;
    return;
  }
  let o = !1;
  if (n === "" || n == null) {
    const a = typeof e[t];
    a === "boolean" ? n = so(n) : n == null && a === "string" ? (n = "", o = !0) : a === "number" && (n = 0, o = !0);
  }
  try {
    e[t] = n;
  } catch {
  }
  o && e.removeAttribute(s || t);
}
function Xt(e, t, n, r) {
  e.addEventListener(t, n, r);
}
function Kc(e, t, n, r) {
  e.removeEventListener(t, n, r);
}
const Ai = /* @__PURE__ */ Symbol("_vei");
function Nc(e, t, n, r, s = null) {
  const i = e[Ai] || (e[Ai] = {}), o = i[t];
  if (r && o)
    o.value = r;
  else {
    const [a, l] = qc(t);
    if (r) {
      const c = i[t] = Hc(
        r,
        s
      );
      Xt(e, a, c, l);
    } else o && (Kc(e, a, o, l), i[t] = void 0);
  }
}
const Lc = /(Once|Passive|Capture)$/, Wc = /^on:?(?:Once|Passive|Capture)$/;
function qc(e) {
  let t, n;
  for (; (n = e.match(Lc)) && !Wc.test(e); )
    t || (t = {}), e = e.slice(0, e.length - n[1].length), t[n[1].toLowerCase()] = !0;
  return [e[2] === ":" ? e.slice(3) : Pe(e.slice(2)), t];
}
let Zr = 0;
const Jc = /* @__PURE__ */ Promise.resolve(), Zc = () => Zr || (Jc.then(() => Zr = 0), Zr = Date.now());
function Hc(e, t) {
  const n = (r) => {
    if (!r._vts)
      r._vts = Date.now();
    else if (r._vts <= n.attached)
      return;
    const s = n.value;
    if (H(s)) {
      const i = r.stopImmediatePropagation;
      r.stopImmediatePropagation = () => {
        i.call(r), r._stopped = !0;
      };
      const o = s.slice(), a = [r];
      for (let l = 0; l < o.length && !r._stopped; l++) {
        const c = o[l];
        c && ut(
          c,
          t,
          5,
          a
        );
      }
    } else
      ut(
        s,
        t,
        5,
        [r]
      );
  };
  return n.value = e, n.attached = Zc(), n;
}
const xi = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && // lowercase letter
e.charCodeAt(2) > 96 && e.charCodeAt(2) < 123, zc = (e, t, n, r, s, i) => {
  const o = s === "svg";
  t === "class" ? Oc(e, r, o) : t === "style" ? Yc(e, n, r) : vr(t) ? yr(t) || Nc(e, t, n, r, i) : (t[0] === "." ? (t = t.slice(1), !0) : t[0] === "^" ? (t = t.slice(1), !1) : Xc(e, t, r, o)) ? (bi(e, t, r), !e.tagName.includes("-") && (t === "value" || t === "checked" || t === "selected") && wi(e, t, r, o, i, t !== "value")) : /* #11081 force set props for possible async custom element */ e._isVueCE && // #12408 check if it's declared prop or it's async custom element
  (_c(e, t) || // @ts-expect-error _def is private
  e._def.__asyncLoader && (/[A-Z]/.test(t) || !ve(r))) ? bi(e, Ge(t), r, i, t) : (t === "true-value" ? e._trueValue = r : t === "false-value" && (e._falseValue = r), wi(e, t, r, o));
};
function Xc(e, t, n, r) {
  if (r)
    return !!(t === "innerHTML" || t === "textContent" || t in e && xi(t) && le(n));
  if (t === "spellcheck" || t === "draggable" || t === "translate" || t === "autocorrect" || t === "sandbox" && e.tagName === "IFRAME" || t === "form" || t === "list" && e.tagName === "INPUT" || t === "type" && e.tagName === "TEXTAREA")
    return !1;
  if (t === "width" || t === "height") {
    const s = e.tagName;
    if (s === "IMG" || s === "VIDEO" || s === "CANVAS" || s === "SOURCE")
      return !1;
  }
  return xi(t) && ve(n) ? !1 : t in e;
}
function _c(e, t) {
  const n = (
    // @ts-expect-error _def is private
    e._def.props
  );
  if (!n)
    return !1;
  const r = Ge(t);
  return Array.isArray(n) ? n.some((s) => Ge(s) === r) : Object.keys(n).some((s) => Ge(s) === r);
}
const Vi = {};
// @__NO_SIDE_EFFECTS__
function $c(e, t, n) {
  let r = /* @__PURE__ */ ke(e, t);
  wr(r) && (r = Fe({}, r, t));
  class s extends Os {
    constructor(o) {
      super(r, o, n);
    }
  }
  return s.def = r, s;
}
const eu = typeof HTMLElement < "u" ? HTMLElement : class {
};
class Os extends eu {
  constructor(t, n = {}, r = Bi) {
    super(), this._def = t, this._props = n, this._createApp = r, this._isVueCE = !0, this._instance = null, this._app = null, this._nonce = this._def.nonce, this._connected = !1, this._resolved = !1, this._patching = !1, this._dirty = !1, this._numberProps = null, this._styleChildren = /* @__PURE__ */ new WeakSet(), this._styleAnchors = /* @__PURE__ */ new WeakMap(), this._ob = null, this.shadowRoot && r !== Bi ? this._root = this.shadowRoot : t.shadowRoot !== !1 ? (this.attachShadow(
      Fe({}, t.shadowRootOptions, {
        mode: "open"
      })
    ), this._root = this.shadowRoot) : this._root = this;
  }
  connectedCallback() {
    if (!this.isConnected) return;
    !this.shadowRoot && !this._resolved && this._parseSlots(), this._connected = !0;
    let t = this;
    for (; t = t && // #12479 should check assignedSlot first to get correct parent
    (t.assignedSlot || t.parentNode || t.host); )
      if (t instanceof Os) {
        this._parent = t;
        break;
      }
    this._instance || (this._resolved ? this._mount(this._def) : t && t._pendingResolve ? this._pendingResolve = t._pendingResolve.then(() => {
      this._pendingResolve = void 0, this._resolveDef();
    }) : this._resolveDef());
  }
  _setParent(t = this._parent) {
    t && (this._instance.parent = t._instance, this._inheritParentContext(t));
  }
  _inheritParentContext(t = this._parent) {
    t && this._app && Object.setPrototypeOf(
      this._app._context.provides,
      t._instance.provides
    );
  }
  disconnectedCallback() {
    this._connected = !1, qe(() => {
      this._connected || (this._ob && (this._ob.disconnect(), this._ob = null), this._app && this._app.unmount(), this._instance && (this._instance.ce = void 0), this._app = this._instance = null, this._teleportTargets && (this._teleportTargets.clear(), this._teleportTargets = void 0));
    });
  }
  _processMutations(t) {
    for (const n of t)
      this._setAttr(n.attributeName);
  }
  /**
   * resolve inner component definition (handle possible async component)
   */
  _resolveDef() {
    if (this._pendingResolve)
      return;
    for (let r = 0; r < this.attributes.length; r++)
      this._setAttr(this.attributes[r].name);
    this._ob = new MutationObserver(this._processMutations.bind(this)), this._ob.observe(this, { attributes: !0 });
    const t = (r, s = !1) => {
      this._resolved = !0, this._pendingResolve = void 0;
      const { props: i, styles: o } = r;
      let a;
      if (i && !H(i))
        for (const l in i) {
          const c = i[l];
          (c === Number || c && c.type === Number) && (l in this._props && (this._props[l] = ei(this._props[l])), (a || (a = /* @__PURE__ */ Object.create(null)))[Ge(l)] = !0);
        }
      this._numberProps = a, this._resolveProps(r), this.shadowRoot && this._applyStyles(o), this._mount(r);
    }, n = this._def.__asyncLoader;
    n ? this._pendingResolve = n().then((r) => {
      r.configureApp = this._def.configureApp, t(this._def = r, !0);
    }) : t(this._def);
  }
  _mount(t) {
    this._app = this._createApp(t), this._inheritParentContext(), t.configureApp && t.configureApp(this._app), this._app._ceVNode = this._createVNode(), this._app.mount(this._root);
    const n = this._instance && this._instance.exposed;
    if (n)
      for (const r in n)
        ie(this, r) || Object.defineProperty(this, r, {
          // unwrap ref to be consistent with public instance behavior
          get: () => ee(n[r])
        });
  }
  _resolveProps(t) {
    const { props: n } = t, r = H(n) ? n : Object.keys(n || {});
    for (const s of Object.keys(this))
      s[0] !== "_" && r.includes(s) && this._setProp(s, this[s]);
    for (const s of r.map(Ge))
      Object.defineProperty(this, s, {
        get() {
          return this._getProp(s);
        },
        set(i) {
          this._setProp(s, i, !0, !this._patching);
        }
      });
  }
  _setAttr(t) {
    if (t.startsWith("data-v-")) return;
    const n = this.hasAttribute(t);
    let r = n ? this.getAttribute(t) : Vi;
    const s = Ge(t);
    n && this._numberProps && this._numberProps[s] && (r = ei(r)), this._setProp(s, r, !1, !0);
  }
  /**
   * @internal
   */
  _getProp(t) {
    return this._props[t];
  }
  /**
   * @internal
   */
  _setProp(t, n, r = !0, s = !1) {
    if (n !== this._props[t] && (this._dirty = !0, n === Vi ? delete this._props[t] : (this._props[t] = n, t === "key" && this._app && (this._app._ceVNode.key = n)), s && this._instance && this._update(), r)) {
      const i = this._ob;
      i && (this._processMutations(i.takeRecords()), i.disconnect()), n === !0 ? this.setAttribute(Pe(t), "") : typeof n == "string" || typeof n == "number" ? this.setAttribute(Pe(t), n + "") : n || this.removeAttribute(Pe(t)), i && i.observe(this, { attributes: !0 });
    }
  }
  _update() {
    const t = this._createVNode();
    this._app && (t.appContext = this._app._context), au(t, this._root);
  }
  _createVNode() {
    const t = {};
    this.shadowRoot || (t.onVnodeMounted = t.onVnodeUpdated = this._renderSlots.bind(this));
    const n = J(this._def, Fe(t, this._props));
    return this._instance || (n.ce = (r) => {
      this._instance = r, r.ce = this, r.isCE = !0;
      const s = (i, o) => {
        this.dispatchEvent(
          new CustomEvent(
            i,
            wr(o[0]) ? Fe({ detail: o }, o[0]) : { detail: o }
          )
        );
      };
      r.emit = (i, ...o) => {
        s(i, o), Pe(i) !== i && s(Pe(i), o);
      }, this._setParent();
    }), n;
  }
  _applyStyles(t, n, r) {
    if (!t) return;
    if (n) {
      if (n === this._def || this._styleChildren.has(n))
        return;
      this._styleChildren.add(n);
    }
    const s = this._nonce, i = this.shadowRoot, o = r ? this._getStyleAnchor(r) || this._getStyleAnchor(this._def) : this._getRootStyleInsertionAnchor(i);
    let a = null;
    for (let l = t.length - 1; l >= 0; l--) {
      const c = document.createElement("style");
      s && c.setAttribute("nonce", s), c.textContent = t[l], i.insertBefore(c, a || o), a = c, l === 0 && (r || this._styleAnchors.set(this._def, c), n && this._styleAnchors.set(n, c));
    }
  }
  _getStyleAnchor(t) {
    if (!t)
      return null;
    const n = this._styleAnchors.get(t);
    return n && n.parentNode === this.shadowRoot ? n : (n && this._styleAnchors.delete(t), null);
  }
  _getRootStyleInsertionAnchor(t) {
    for (let n = 0; n < t.childNodes.length; n++) {
      const r = t.childNodes[n];
      if (!(r instanceof HTMLStyleElement))
        return r;
    }
    return null;
  }
  /**
   * Only called when shadowRoot is false
   */
  _parseSlots() {
    const t = this._slots = {};
    let n;
    for (; n = this.firstChild; ) {
      const r = n.nodeType === 1 && n.getAttribute("slot") || "default";
      (t[r] || (t[r] = [])).push(n), this.removeChild(n);
    }
  }
  /**
   * Only called when shadowRoot is false
   */
  _renderSlots() {
    const t = this._getSlots(), n = this._instance.type.__scopeId;
    for (let r = 0; r < t.length; r++) {
      const s = t[r], i = s.getAttribute("name") || "default", o = this._slots[i], a = s.parentNode;
      if (o)
        for (const l of o) {
          if (n && l.nodeType === 1) {
            const c = n + "-s", u = document.createTreeWalker(l, 1);
            l.setAttribute(c, "");
            let h;
            for (; h = u.nextNode(); )
              h.setAttribute(c, "");
          }
          a.insertBefore(l, s);
        }
      else
        for (; s.firstChild; ) a.insertBefore(s.firstChild, s);
      a.removeChild(s);
    }
  }
  /**
   * @internal
   */
  _getSlots() {
    const t = [this];
    this._teleportTargets && t.push(...this._teleportTargets);
    const n = /* @__PURE__ */ new Set();
    for (const r of t) {
      const s = r.querySelectorAll("slot");
      for (let i = 0; i < s.length; i++)
        n.add(s[i]);
    }
    return Array.from(n);
  }
  /**
   * @internal
   */
  _injectChildStyle(t, n) {
    this._applyStyles(t.styles, t, n);
  }
  /**
   * @internal
   */
  _beginPatch() {
    this._patching = !0, this._dirty = !1;
  }
  /**
   * @internal
   */
  _endPatch() {
    this._patching = !1, this._dirty && this._instance && this._update();
  }
  /**
   * @internal
   */
  _hasShadowRoot() {
    return this._def.shadowRoot !== !1;
  }
  /**
   * @internal
   */
  _removeChildStyle(t) {
  }
}
const Ci = (e) => {
  const t = e.props["onUpdate:modelValue"] || !1;
  return H(t) ? (n) => zn(t, n) : t;
};
function tu(e) {
  e.target.composing = !0;
}
function Si(e) {
  const t = e.target;
  t.composing && (t.composing = !1, t.dispatchEvent(new Event("input")));
}
const Hr = /* @__PURE__ */ Symbol("_assign");
function Ei(e, t, n) {
  return t && (e = e.trim()), n && (e = As(e)), e;
}
const nu = {
  created(e, { modifiers: { lazy: t, trim: n, number: r } }, s) {
    e[Hr] = Ci(s);
    const i = r || s.props && s.props.type === "number";
    Xt(e, t ? "change" : "input", (o) => {
      o.target.composing || e[Hr](Ei(e.value, n, i));
    }), (n || i) && Xt(e, "change", () => {
      e.value = Ei(e.value, n, i);
    }), t || (Xt(e, "compositionstart", tu), Xt(e, "compositionend", Si), Xt(e, "change", Si));
  },
  // set value on mounted so it's after min/max for type="range"
  mounted(e, { value: t }) {
    e.value = t ?? "";
  },
  beforeUpdate(e, { value: t, oldValue: n, modifiers: { lazy: r, trim: s, number: i } }, o) {
    if (e[Hr] = Ci(o), e.composing) return;
    const a = (i || e.type === "number") && !/^0\d/.test(e.value) ? As(e.value) : e.value, l = t ?? "";
    if (a === l)
      return;
    const c = e.getRootNode();
    (c instanceof Document || c instanceof ShadowRoot) && c.activeElement === e && e.type !== "range" && (r && t === n || s && e.value.trim() === l) || (e.value = l);
  }
}, ru = ["ctrl", "shift", "alt", "meta"], su = {
  stop: (e) => e.stopPropagation(),
  prevent: (e) => e.preventDefault(),
  self: (e) => e.target !== e.currentTarget,
  ctrl: (e) => !e.ctrlKey,
  shift: (e) => !e.shiftKey,
  alt: (e) => !e.altKey,
  meta: (e) => !e.metaKey,
  left: (e) => "button" in e && e.button !== 0,
  middle: (e) => "button" in e && e.button !== 1,
  right: (e) => "button" in e && e.button !== 2,
  exact: (e, t) => ru.some((n) => e[`${n}Key`] && !t.includes(n))
}, Bn = (e, t) => {
  if (!e) return e;
  const n = e._withMods || (e._withMods = {}), r = t.join(".");
  return n[r] || (n[r] = ((s, ...i) => {
    for (let o = 0; o < t.length; o++) {
      const a = su[t[o]];
      if (a && a(s, t)) return;
    }
    return e(s, ...i);
  }));
}, iu = {
  esc: "escape",
  space: " ",
  up: "arrow-up",
  left: "arrow-left",
  right: "arrow-right",
  down: "arrow-down",
  delete: "backspace"
}, Ii = (e, t) => {
  const n = e._withKeys || (e._withKeys = {}), r = t.join(".");
  return n[r] || (n[r] = ((s) => {
    if (!("key" in s))
      return;
    const i = Pe(s.key);
    if (t.some(
      (o) => o === i || iu[o] === i
    ))
      return e(s);
  }));
}, ou = /* @__PURE__ */ Fe({ patchProp: zc }, Dc);
let Mi;
function ra() {
  return Mi || (Mi = pc(ou));
}
const au = ((...e) => {
  ra().render(...e);
}), Bi = ((...e) => {
  const t = ra().createApp(...e), { mount: n } = t;
  return t.mount = (r) => {
    const s = cu(r);
    if (!s) return;
    const i = t._component;
    !le(i) && !i.render && !i.template && (i.template = s.innerHTML), s.nodeType === 1 && (s.textContent = "");
    const o = n(s, !1, lu(s));
    return s instanceof Element && (s.removeAttribute("v-cloak"), s.setAttribute("data-v-app", "")), o;
  }, t;
});
function lu(e) {
  if (e instanceof SVGElement)
    return "svg";
  if (typeof MathMLElement == "function" && e instanceof MathMLElement)
    return "mathml";
}
function cu(e) {
  return ve(e) ? document.querySelector(e) : e;
}
var on = class {
  constructor() {
    this.listeners = /* @__PURE__ */ new Set(), this.subscribe = this.subscribe.bind(this);
  }
  subscribe(e) {
    return this.listeners.add(e), this.onSubscribe(), () => {
      this.listeners.delete(e), this.onUnsubscribe();
    };
  }
  hasListeners() {
    return this.listeners.size > 0;
  }
  onSubscribe() {
  }
  onUnsubscribe() {
  }
}, uu = class extends on {
  #e;
  #t;
  #n;
  constructor() {
    super(), this.#n = (e) => {
      if (typeof window < "u" && window.addEventListener) {
        const t = () => e();
        return window.addEventListener("visibilitychange", t, !1), () => {
          window.removeEventListener("visibilitychange", t);
        };
      }
    };
  }
  onSubscribe() {
    this.#t || this.setEventListener(this.#n);
  }
  onUnsubscribe() {
    this.hasListeners() || (this.#t?.(), this.#t = void 0);
  }
  setEventListener(e) {
    this.#n = e, this.#t?.(), this.#t = e((t) => {
      typeof t == "boolean" ? this.setFocused(t) : this.onFocus();
    });
  }
  setFocused(e) {
    this.#e !== e && (this.#e = e, this.onFocus());
  }
  onFocus() {
    const e = this.isFocused();
    this.listeners.forEach((t) => {
      t(e);
    });
  }
  isFocused() {
    return typeof this.#e == "boolean" ? this.#e : globalThis.document?.visibilityState !== "hidden";
  }
}, Gs = new uu(), fu = {
  // We need the wrapper function syntax below instead of direct references to
  // global setTimeout etc.
  //
  // BAD: `setTimeout: setTimeout`
  // GOOD: `setTimeout: (cb, delay) => setTimeout(cb, delay)`
  //
  // If we use direct references here, then anything that wants to spy on or
  // replace the global setTimeout (like tests) won't work since we'll already
  // have a hard reference to the original implementation at the time when this
  // file was imported.
  setTimeout: (e, t) => setTimeout(e, t),
  clearTimeout: (e) => clearTimeout(e),
  setInterval: (e, t) => setInterval(e, t),
  clearInterval: (e) => clearInterval(e)
}, hu = class {
  // We cannot have TimeoutManager<T> as we must instantiate it with a concrete
  // type at app boot; and if we leave that type, then any new timer provider
  // would need to support the default provider's concrete timer ID, which is
  // infeasible across environments.
  //
  // We settle for type safety for the TimeoutProvider type, and accept that
  // this class is unsafe internally to allow for extension.
  #e = fu;
  #t = !1;
  setTimeoutProvider(e) {
    this.#e = e;
  }
  setTimeout(e, t) {
    return this.#e.setTimeout(e, t);
  }
  clearTimeout(e) {
    this.#e.clearTimeout(e);
  }
  setInterval(e, t) {
    return this.#e.setInterval(e, t);
  }
  clearInterval(e) {
    this.#e.clearInterval(e);
  }
}, Tt = new hu();
function du(e) {
  setTimeout(e, 0);
}
var pu = typeof window > "u" || "Deno" in globalThis;
function We() {
}
function gu(e, t) {
  return typeof e == "function" ? e(t) : e;
}
function os(e) {
  return typeof e == "number" && e >= 0 && e !== 1 / 0;
}
function sa(e, t) {
  return Math.max(e + (t || 0) - Date.now(), 0);
}
function Mt(e, t) {
  return typeof e == "function" ? e(t) : e;
}
function Ye(e, t) {
  return typeof e == "function" ? e(t) : e;
}
function ki(e, t) {
  const {
    type: n = "all",
    exact: r,
    fetchStatus: s,
    predicate: i,
    queryKey: o,
    stale: a
  } = e;
  if (o) {
    if (r) {
      if (t.queryHash !== Ts(o, t.options))
        return !1;
    } else if (!kn(t.queryKey, o))
      return !1;
  }
  if (n !== "all") {
    const l = t.isActive();
    if (n === "active" && !l || n === "inactive" && l)
      return !1;
  }
  return !(typeof a == "boolean" && t.isStale() !== a || s && s !== t.state.fetchStatus || i && !i(t));
}
function Ri(e, t) {
  const { exact: n, status: r, predicate: s, mutationKey: i } = e;
  if (i) {
    if (!t.options.mutationKey)
      return !1;
    if (n) {
      if (Jt(t.options.mutationKey) !== Jt(i))
        return !1;
    } else if (!kn(t.options.mutationKey, i))
      return !1;
  }
  return !(r && t.state.status !== r || s && !s(t));
}
function Ts(e, t) {
  return (t?.queryKeyHashFn || Jt)(e);
}
function Jt(e) {
  return JSON.stringify(
    e,
    (t, n) => as(n) ? Object.keys(n).sort().reduce((r, s) => (r[s] = n[s], r), {}) : n
  );
}
function kn(e, t) {
  return e === t ? !0 : typeof e != typeof t ? !1 : e && t && typeof e == "object" && typeof t == "object" ? Object.keys(t).every((n) => kn(e[n], t[n])) : !1;
}
var mu = Object.prototype.hasOwnProperty;
function ia(e, t, n = 0) {
  if (e === t)
    return e;
  if (n > 500) return t;
  const r = Fi(e) && Fi(t);
  if (!r && !(as(e) && as(t))) return t;
  const i = (r ? e : Object.keys(e)).length, o = r ? t : Object.keys(t), a = o.length, l = r ? new Array(a) : {};
  let c = 0;
  for (let u = 0; u < a; u++) {
    const h = r ? u : o[u], m = e[h], g = t[h];
    if (m === g) {
      l[h] = m, (r ? u < i : mu.call(e, h)) && c++;
      continue;
    }
    if (m === null || g === null || typeof m != "object" || typeof g != "object") {
      l[h] = g;
      continue;
    }
    const w = ia(m, g, n + 1);
    l[h] = w, w === m && c++;
  }
  return i === a && c === i ? e : l;
}
function hr(e, t) {
  if (!t || Object.keys(e).length !== Object.keys(t).length)
    return !1;
  for (const n in e)
    if (e[n] !== t[n])
      return !1;
  return !0;
}
function Fi(e) {
  return Array.isArray(e) && e.length === Object.keys(e).length;
}
function as(e) {
  if (!Qi(e))
    return !1;
  const t = e.constructor;
  if (t === void 0)
    return !0;
  const n = t.prototype;
  return !(!Qi(n) || !n.hasOwnProperty("isPrototypeOf") || Object.getPrototypeOf(e) !== Object.prototype);
}
function Qi(e) {
  return Object.prototype.toString.call(e) === "[object Object]";
}
function vu(e) {
  return new Promise((t) => {
    Tt.setTimeout(t, e);
  });
}
function ls(e, t, n) {
  return typeof n.structuralSharing == "function" ? n.structuralSharing(e, t) : n.structuralSharing !== !1 ? ia(e, t) : t;
}
function yu(e, t, n = 0) {
  const r = [...e, t];
  return n && r.length > n ? r.slice(1) : r;
}
function wu(e, t, n = 0) {
  const r = [t, ...e];
  return n && r.length > n ? r.slice(0, -1) : r;
}
var Ys = /* @__PURE__ */ Symbol();
function oa(e, t) {
  return !e.queryFn && t?.initialPromise ? () => t.initialPromise : !e.queryFn || e.queryFn === Ys ? () => Promise.reject(new Error(`Missing queryFn: '${e.queryHash}'`)) : e.queryFn;
}
function cs(e, t) {
  return typeof e == "function" ? e(...t) : !!e;
}
function bu(e, t, n) {
  let r = !1, s;
  return Object.defineProperty(e, "signal", {
    enumerable: !0,
    get: () => (s ??= t(), r || (r = !0, s.aborted ? n() : s.addEventListener("abort", n, { once: !0 })), s)
  }), e;
}
var Rn = /* @__PURE__ */ (() => {
  let e = () => pu;
  return {
    /**
     * Returns whether the current runtime should be treated as a server environment.
     */
    isServer() {
      return e();
    },
    /**
     * Overrides the server check globally.
     */
    setIsServer(t) {
      e = t;
    }
  };
})();
function us() {
  let e, t;
  const n = new Promise((s, i) => {
    e = s, t = i;
  });
  n.status = "pending", n.catch(() => {
  });
  function r(s) {
    Object.assign(n, s), delete n.resolve, delete n.reject;
  }
  return n.resolve = (s) => {
    r({
      status: "fulfilled",
      value: s
    }), e(s);
  }, n.reject = (s) => {
    r({
      status: "rejected",
      reason: s
    }), t(s);
  }, n;
}
var Au = du;
function xu() {
  let e = [], t = 0, n = (a) => {
    a();
  }, r = (a) => {
    a();
  }, s = Au;
  const i = (a) => {
    t ? e.push(a) : s(() => {
      n(a);
    });
  }, o = () => {
    const a = e;
    e = [], a.length && s(() => {
      r(() => {
        a.forEach((l) => {
          n(l);
        });
      });
    });
  };
  return {
    batch: (a) => {
      let l;
      t++;
      try {
        l = a();
      } finally {
        t--, t || o();
      }
      return l;
    },
    /**
     * All calls to the wrapped function will be batched.
     */
    batchCalls: (a) => (...l) => {
      i(() => {
        a(...l);
      });
    },
    schedule: i,
    /**
     * Use this method to set a custom notify function.
     * This can be used to for example wrap notifications with `React.act` while running tests.
     */
    setNotifyFunction: (a) => {
      n = a;
    },
    /**
     * Use this method to set a custom function to batch notifications together into a single tick.
     * By default React Query will use the batch function provided by ReactDOM or React Native.
     */
    setBatchNotifyFunction: (a) => {
      r = a;
    },
    setScheduler: (a) => {
      s = a;
    }
  };
}
var Me = xu(), Vu = class extends on {
  #e = !0;
  #t;
  #n;
  constructor() {
    super(), this.#n = (e) => {
      if (typeof window < "u" && window.addEventListener) {
        const t = () => e(!0), n = () => e(!1);
        return window.addEventListener("online", t, !1), window.addEventListener("offline", n, !1), () => {
          window.removeEventListener("online", t), window.removeEventListener("offline", n);
        };
      }
    };
  }
  onSubscribe() {
    this.#t || this.setEventListener(this.#n);
  }
  onUnsubscribe() {
    this.hasListeners() || (this.#t?.(), this.#t = void 0);
  }
  setEventListener(e) {
    this.#n = e, this.#t?.(), this.#t = e(this.setOnline.bind(this));
  }
  setOnline(e) {
    this.#e !== e && (this.#e = e, this.listeners.forEach((n) => {
      n(e);
    }));
  }
  isOnline() {
    return this.#e;
  }
}, dr = new Vu();
function Cu(e) {
  return Math.min(1e3 * 2 ** e, 3e4);
}
function aa(e) {
  return (e ?? "online") === "online" ? dr.isOnline() : !0;
}
var fs = class extends Error {
  constructor(e) {
    super("CancelledError"), this.revert = e?.revert, this.silent = e?.silent;
  }
};
function la(e) {
  let t = !1, n = 0, r;
  const s = us(), i = () => s.status !== "pending", o = (p) => {
    if (!i()) {
      const R = new fs(p);
      m(R), e.onCancel?.(R);
    }
  }, a = () => {
    t = !0;
  }, l = () => {
    t = !1;
  }, c = () => Gs.isFocused() && (e.networkMode === "always" || dr.isOnline()) && e.canRun(), u = () => aa(e.networkMode) && e.canRun(), h = (p) => {
    i() || (r?.(), s.resolve(p));
  }, m = (p) => {
    i() || (r?.(), s.reject(p));
  }, g = () => new Promise((p) => {
    r = (R) => {
      (i() || c()) && p(R);
    }, e.onPause?.();
  }).then(() => {
    r = void 0, i() || e.onContinue?.();
  }), w = () => {
    if (i())
      return;
    let p;
    const R = n === 0 ? e.initialPromise : void 0;
    try {
      p = R ?? e.fn();
    } catch (F) {
      p = Promise.reject(F);
    }
    Promise.resolve(p).then(h).catch((F) => {
      if (i())
        return;
      const I = e.retry ?? (Rn.isServer() ? 0 : 3), O = e.retryDelay ?? Cu, E = typeof O == "function" ? O(n, F) : O, b = I === !0 || typeof I == "number" && n < I || typeof I == "function" && I(n, F);
      if (t || !b) {
        m(F);
        return;
      }
      n++, e.onFail?.(n, F), vu(E).then(() => c() ? void 0 : g()).then(() => {
        t ? m(F) : w();
      });
    });
  };
  return {
    promise: s,
    status: () => s.status,
    cancel: o,
    continue: () => (r?.(), s),
    cancelRetry: a,
    continueRetry: l,
    canStart: u,
    start: () => (u() ? w() : g().then(w), s)
  };
}
var ca = class {
  #e;
  destroy() {
    this.clearGcTimeout();
  }
  scheduleGc() {
    this.clearGcTimeout(), os(this.gcTime) && (this.#e = Tt.setTimeout(() => {
      this.optionalRemove();
    }, this.gcTime));
  }
  updateGcTime(e) {
    this.gcTime = Math.max(
      this.gcTime || 0,
      e ?? (Rn.isServer() ? 1 / 0 : 300 * 1e3)
    );
  }
  clearGcTimeout() {
    this.#e !== void 0 && (Tt.clearTimeout(this.#e), this.#e = void 0);
  }
};
function Su(e) {
  return {
    onFetch: (t, n) => {
      const r = t.options, s = t.fetchOptions?.meta?.fetchMore?.direction, i = t.state.data?.pages || [], o = t.state.data?.pageParams || [];
      let a = { pages: [], pageParams: [] }, l = 0;
      const c = async () => {
        let u = !1;
        const h = (w) => {
          bu(
            w,
            () => t.signal,
            () => u = !0
          );
        }, m = oa(t.options, t.fetchOptions), g = async (w, p, R) => {
          if (u)
            return Promise.reject(t.signal.reason);
          if (p == null && w.pages.length)
            return Promise.resolve(w);
          const I = (() => {
            const C = {
              client: t.client,
              queryKey: t.queryKey,
              pageParam: p,
              direction: R ? "backward" : "forward",
              meta: t.options.meta
            };
            return h(C), C;
          })(), O = await m(I), { maxPages: E } = t.options, b = R ? wu : yu;
          return {
            pages: b(w.pages, O, E),
            pageParams: b(w.pageParams, p, E)
          };
        };
        if (s && i.length) {
          const w = s === "backward", p = w ? Eu : Di, R = {
            pages: i,
            pageParams: o
          }, F = p(r, R);
          a = await g(R, F, w);
        } else {
          const w = e ?? i.length;
          do {
            const p = l === 0 ? o[0] ?? r.initialPageParam : Di(r, a);
            if (l > 0 && p == null)
              break;
            a = await g(a, p), l++;
          } while (l < w);
        }
        return a;
      };
      t.options.persister ? t.fetchFn = () => t.options.persister?.(
        c,
        {
          client: t.client,
          queryKey: t.queryKey,
          meta: t.options.meta,
          signal: t.signal
        },
        n
      ) : t.fetchFn = c;
    }
  };
}
function Di(e, { pages: t, pageParams: n }) {
  const r = t.length - 1;
  return t.length > 0 ? e.getNextPageParam(
    t[r],
    t,
    n[r],
    n
  ) : void 0;
}
function Eu(e, { pages: t, pageParams: n }) {
  return t.length > 0 ? e.getPreviousPageParam?.(t[0], t, n[0], n) : void 0;
}
var Iu = class extends ca {
  #e;
  #t;
  #n;
  #r;
  #i;
  #s;
  #a;
  #o;
  constructor(e) {
    super(), this.#o = !1, this.#a = e.defaultOptions, this.setOptions(e.options), this.observers = [], this.#i = e.client, this.#r = this.#i.getQueryCache(), this.queryKey = e.queryKey, this.queryHash = e.queryHash, this.#t = Oi(this.options), this.state = e.state ?? this.#t, this.scheduleGc();
  }
  get meta() {
    return this.options.meta;
  }
  get queryType() {
    return this.#e;
  }
  get promise() {
    return this.#s?.promise;
  }
  setOptions(e) {
    if (this.options = { ...this.#a, ...e }, e?._type && (this.#e = e._type), this.updateGcTime(this.options.gcTime), this.state && this.state.data === void 0) {
      const t = Oi(this.options);
      t.data !== void 0 && (this.setState(
        Ui(t.data, t.dataUpdatedAt)
      ), this.#t = t);
    }
  }
  optionalRemove() {
    !this.observers.length && this.state.fetchStatus === "idle" && this.#r.remove(this);
  }
  setData(e, t) {
    const n = ls(this.state.data, e, this.options);
    return this.#l({
      data: n,
      type: "success",
      dataUpdatedAt: t?.updatedAt,
      manual: t?.manual
    }), n;
  }
  setState(e) {
    this.#l({ type: "setState", state: e });
  }
  cancel(e) {
    const t = this.#s?.promise;
    return this.#s?.cancel(e), t ? t.then(We).catch(We) : Promise.resolve();
  }
  destroy() {
    super.destroy(), this.cancel({ silent: !0 });
  }
  get resetState() {
    return this.#t;
  }
  reset() {
    this.destroy(), this.setState(this.resetState);
  }
  isActive() {
    return this.observers.some(
      (e) => Ye(e.options.enabled, this) !== !1
    );
  }
  isDisabled() {
    return this.getObserversCount() > 0 ? !this.isActive() : this.options.queryFn === Ys || !this.isFetched();
  }
  isFetched() {
    return this.state.dataUpdateCount + this.state.errorUpdateCount > 0;
  }
  isStatic() {
    return this.getObserversCount() > 0 ? this.observers.some(
      (e) => Mt(e.options.staleTime, this) === "static"
    ) : !1;
  }
  isStale() {
    return this.getObserversCount() > 0 ? this.observers.some(
      (e) => e.getCurrentResult().isStale
    ) : this.state.data === void 0 || this.state.isInvalidated;
  }
  isStaleByTime(e = 0) {
    return this.state.data === void 0 ? !0 : e === "static" ? !1 : this.state.isInvalidated ? !0 : !sa(this.state.dataUpdatedAt, e);
  }
  onFocus() {
    this.observers.find((t) => t.shouldFetchOnWindowFocus())?.refetch({ cancelRefetch: !1 }), this.#s?.continue();
  }
  onOnline() {
    this.observers.find((t) => t.shouldFetchOnReconnect())?.refetch({ cancelRefetch: !1 }), this.#s?.continue();
  }
  addObserver(e) {
    this.observers.includes(e) || (this.observers.push(e), this.clearGcTimeout(), this.#r.notify({ type: "observerAdded", query: this, observer: e }));
  }
  removeObserver(e) {
    this.observers.includes(e) && (this.observers = this.observers.filter((t) => t !== e), this.observers.length || (this.#s && (this.#o || this.#u() ? this.#s.cancel({ revert: !0 }) : this.#s.cancelRetry()), this.scheduleGc()), this.#r.notify({ type: "observerRemoved", query: this, observer: e }));
  }
  getObserversCount() {
    return this.observers.length;
  }
  #u() {
    return this.state.fetchStatus === "paused" && this.state.status === "pending";
  }
  invalidate() {
    this.state.isInvalidated || this.#l({ type: "invalidate" });
  }
  async fetch(e, t) {
    if (this.state.fetchStatus !== "idle" && // If the promise in the retryer is already rejected, we have to definitely
    // re-start the fetch; there is a chance that the query is still in a
    // pending state when that happens
    this.#s?.status() !== "rejected") {
      if (this.state.data !== void 0 && t?.cancelRefetch)
        this.cancel({ silent: !0 });
      else if (this.#s)
        return this.#s.continueRetry(), this.#s.promise;
    }
    if (e && this.setOptions(e), !this.options.queryFn) {
      const l = this.observers.find((c) => c.options.queryFn);
      l && this.setOptions(l.options);
    }
    const n = new AbortController(), r = (l) => {
      Object.defineProperty(l, "signal", {
        enumerable: !0,
        get: () => (this.#o = !0, n.signal)
      });
    }, s = () => {
      const l = oa(this.options, t), u = (() => {
        const h = {
          client: this.#i,
          queryKey: this.queryKey,
          meta: this.meta
        };
        return r(h), h;
      })();
      return this.#o = !1, this.options.persister ? this.options.persister(
        l,
        u,
        this
      ) : l(u);
    }, o = (() => {
      const l = {
        fetchOptions: t,
        options: this.options,
        queryKey: this.queryKey,
        client: this.#i,
        state: this.state,
        fetchFn: s
      };
      return r(l), l;
    })();
    (this.#e === "infinite" ? Su(
      this.options.pages
    ) : this.options.behavior)?.onFetch(o, this), this.#n = this.state, (this.state.fetchStatus === "idle" || this.state.fetchMeta !== o.fetchOptions?.meta) && this.#l({ type: "fetch", meta: o.fetchOptions?.meta }), this.#s = la({
      initialPromise: t?.initialPromise,
      fn: o.fetchFn,
      onCancel: (l) => {
        l instanceof fs && l.revert && this.setState({
          ...this.#n,
          fetchStatus: "idle"
        }), n.abort();
      },
      onFail: (l, c) => {
        this.#l({ type: "failed", failureCount: l, error: c });
      },
      onPause: () => {
        this.#l({ type: "pause" });
      },
      onContinue: () => {
        this.#l({ type: "continue" });
      },
      retry: o.options.retry,
      retryDelay: o.options.retryDelay,
      networkMode: o.options.networkMode,
      canRun: () => !0
    });
    try {
      const l = await this.#s.start();
      if (l === void 0)
        throw new Error(`${this.queryHash} data is undefined`);
      return this.setData(l), this.#r.config.onSuccess?.(l, this), this.#r.config.onSettled?.(
        l,
        this.state.error,
        this
      ), l;
    } catch (l) {
      if (l instanceof fs) {
        if (l.silent)
          return this.#s.promise;
        if (l.revert) {
          if (this.state.data === void 0)
            throw l;
          return this.state.data;
        }
      }
      throw this.#l({
        type: "error",
        error: l
      }), this.#r.config.onError?.(
        l,
        this
      ), this.#r.config.onSettled?.(
        this.state.data,
        l,
        this
      ), l;
    } finally {
      this.scheduleGc();
    }
  }
  #l(e) {
    const t = (n) => {
      switch (e.type) {
        case "failed":
          return {
            ...n,
            fetchFailureCount: e.failureCount,
            fetchFailureReason: e.error
          };
        case "pause":
          return {
            ...n,
            fetchStatus: "paused"
          };
        case "continue":
          return {
            ...n,
            fetchStatus: "fetching"
          };
        case "fetch":
          return {
            ...n,
            ...ua(n.data, this.options),
            fetchMeta: e.meta ?? null
          };
        case "success":
          const r = {
            ...n,
            ...Ui(e.data, e.dataUpdatedAt),
            dataUpdateCount: n.dataUpdateCount + 1,
            ...!e.manual && {
              fetchStatus: "idle",
              fetchFailureCount: 0,
              fetchFailureReason: null
            }
          };
          return this.#n = e.manual ? r : void 0, r;
        case "error":
          const s = e.error;
          return {
            ...n,
            error: s,
            errorUpdateCount: n.errorUpdateCount + 1,
            errorUpdatedAt: Date.now(),
            fetchFailureCount: n.fetchFailureCount + 1,
            fetchFailureReason: s,
            fetchStatus: "idle",
            status: "error",
            // flag existing data as invalidated if we get a background error
            // note that "no data" always means stale so we can set unconditionally here
            isInvalidated: !0
          };
        case "invalidate":
          return {
            ...n,
            isInvalidated: !0
          };
        case "setState":
          return {
            ...n,
            ...e.state
          };
      }
    };
    this.state = t(this.state), Me.batch(() => {
      this.observers.forEach((n) => {
        n.onQueryUpdate();
      }), this.#r.notify({ query: this, type: "updated", action: e });
    });
  }
};
function ua(e, t) {
  return {
    fetchFailureCount: 0,
    fetchFailureReason: null,
    fetchStatus: aa(t.networkMode) ? "fetching" : "paused",
    ...e === void 0 && {
      error: null,
      status: "pending"
    }
  };
}
function Ui(e, t) {
  return {
    data: e,
    dataUpdatedAt: t ?? Date.now(),
    error: null,
    isInvalidated: !1,
    status: "success"
  };
}
function Oi(e) {
  const t = typeof e.initialData == "function" ? e.initialData() : e.initialData, n = t !== void 0, r = n ? typeof e.initialDataUpdatedAt == "function" ? e.initialDataUpdatedAt() : e.initialDataUpdatedAt : 0;
  return {
    data: t,
    dataUpdateCount: 0,
    dataUpdatedAt: n ? r ?? Date.now() : 0,
    error: null,
    errorUpdateCount: 0,
    errorUpdatedAt: 0,
    fetchFailureCount: 0,
    fetchFailureReason: null,
    fetchMeta: null,
    isInvalidated: !1,
    status: n ? "success" : "pending",
    fetchStatus: "idle"
  };
}
var Mu = class extends on {
  constructor(e, t) {
    super(), this.options = t, this.#e = e, this.#o = null, this.#a = us(), this.bindMethods(), this.setOptions(t);
  }
  #e;
  #t = void 0;
  #n = void 0;
  #r = void 0;
  #i;
  #s;
  #a;
  #o;
  #u;
  #l;
  // This property keeps track of the last query with defined data.
  // It will be used to pass the previous data and query to the placeholder function between renders.
  #p;
  #f;
  #h;
  #c;
  #g = /* @__PURE__ */ new Set();
  bindMethods() {
    this.refetch = this.refetch.bind(this);
  }
  onSubscribe() {
    this.listeners.size === 1 && (this.#t.addObserver(this), Gi(this.#t, this.options) ? this.#d() : this.updateResult(), this.#w());
  }
  onUnsubscribe() {
    this.hasListeners() || this.destroy();
  }
  shouldFetchOnReconnect() {
    return hs(
      this.#t,
      this.options,
      this.options.refetchOnReconnect
    );
  }
  shouldFetchOnWindowFocus() {
    return hs(
      this.#t,
      this.options,
      this.options.refetchOnWindowFocus
    );
  }
  destroy() {
    this.listeners = /* @__PURE__ */ new Set(), this.#b(), this.#A(), this.#t.removeObserver(this);
  }
  setOptions(e) {
    const t = this.options, n = this.#t;
    if (this.options = this.#e.defaultQueryOptions(e), this.options.enabled !== void 0 && typeof this.options.enabled != "boolean" && typeof this.options.enabled != "function" && typeof Ye(this.options.enabled, this.#t) != "boolean")
      throw new Error(
        "Expected enabled to be a boolean or a callback that returns a boolean"
      );
    this.#x(), this.#t.setOptions(this.options), t._defaulted && !hr(this.options, t) && this.#e.getQueryCache().notify({
      type: "observerOptionsUpdated",
      query: this.#t,
      observer: this
    });
    const r = this.hasListeners();
    r && Ti(
      this.#t,
      n,
      this.options,
      t
    ) && this.#d(), this.updateResult(), r && (this.#t !== n || Ye(this.options.enabled, this.#t) !== Ye(t.enabled, this.#t) || Mt(this.options.staleTime, this.#t) !== Mt(t.staleTime, this.#t)) && this.#m();
    const s = this.#v();
    r && (this.#t !== n || Ye(this.options.enabled, this.#t) !== Ye(t.enabled, this.#t) || s !== this.#c) && this.#y(s);
  }
  getOptimisticResult(e) {
    const t = this.#e.getQueryCache().build(this.#e, e), n = this.createResult(t, e);
    return ku(this, n) && (this.#r = n, this.#s = this.options, this.#i = this.#t.state), n;
  }
  getCurrentResult() {
    return this.#r;
  }
  trackResult(e, t) {
    return new Proxy(e, {
      get: (n, r) => (this.trackProp(r), t?.(r), r === "promise" && (this.trackProp("data"), !this.options.experimental_prefetchInRender && this.#a.status === "pending" && this.#a.reject(
        new Error(
          "experimental_prefetchInRender feature flag is not enabled"
        )
      )), Reflect.get(n, r))
    });
  }
  trackProp(e) {
    this.#g.add(e);
  }
  getCurrentQuery() {
    return this.#t;
  }
  refetch({ ...e } = {}) {
    return this.fetch({
      ...e
    });
  }
  fetchOptimistic(e) {
    const t = this.#e.defaultQueryOptions(e), n = this.#e.getQueryCache().build(this.#e, t);
    return n.fetch().then(() => this.createResult(n, t));
  }
  fetch(e) {
    return this.#d({
      ...e,
      cancelRefetch: e.cancelRefetch ?? !0
    }).then(() => (this.updateResult(), this.#r));
  }
  #d(e) {
    this.#x();
    let t = this.#t.fetch(
      this.options,
      e
    );
    return e?.throwOnError || (t = t.catch(We)), t;
  }
  #m() {
    this.#b();
    const e = Mt(
      this.options.staleTime,
      this.#t
    );
    if (Rn.isServer() || this.#r.isStale || !os(e))
      return;
    const n = sa(this.#r.dataUpdatedAt, e) + 1;
    this.#f = Tt.setTimeout(() => {
      this.#r.isStale || this.updateResult();
    }, n);
  }
  #v() {
    return (typeof this.options.refetchInterval == "function" ? this.options.refetchInterval(this.#t) : this.options.refetchInterval) ?? !1;
  }
  #y(e) {
    this.#A(), this.#c = e, !(Rn.isServer() || Ye(this.options.enabled, this.#t) === !1 || !os(this.#c) || this.#c === 0) && (this.#h = Tt.setInterval(() => {
      (this.options.refetchIntervalInBackground || Gs.isFocused()) && this.#d();
    }, this.#c));
  }
  #w() {
    this.#m(), this.#y(this.#v());
  }
  #b() {
    this.#f !== void 0 && (Tt.clearTimeout(this.#f), this.#f = void 0);
  }
  #A() {
    this.#h !== void 0 && (Tt.clearInterval(this.#h), this.#h = void 0);
  }
  createResult(e, t) {
    const n = this.#t, r = this.options, s = this.#r, i = this.#i, o = this.#s, l = e !== n ? e.state : this.#n, { state: c } = e;
    let u = { ...c }, h = !1, m;
    if (t._optimisticResults) {
      const T = this.hasListeners(), $ = !T && Gi(e, t), _ = T && Ti(e, n, t, r);
      ($ || _) && (u = {
        ...u,
        ...ua(c.data, e.options)
      }), t._optimisticResults === "isRestoring" && (u.fetchStatus = "idle");
    }
    let { error: g, errorUpdatedAt: w, status: p } = u;
    m = u.data;
    let R = !1;
    if (t.placeholderData !== void 0 && m === void 0 && p === "pending") {
      let T;
      s?.isPlaceholderData && t.placeholderData === o?.placeholderData ? (T = s.data, R = !0) : T = typeof t.placeholderData == "function" ? t.placeholderData(
        this.#p?.state.data,
        this.#p
      ) : t.placeholderData, T !== void 0 && (p = "success", m = ls(
        s?.data,
        T,
        t
      ), h = !0);
    }
    if (t.select && m !== void 0 && !R)
      if (s && m === i?.data && t.select === this.#u)
        m = this.#l;
      else
        try {
          this.#u = t.select, m = t.select(m), m = ls(s?.data, m, t), this.#l = m, this.#o = null;
        } catch (T) {
          this.#o = T;
        }
    this.#o && (g = this.#o, m = this.#l, w = Date.now(), p = "error");
    const F = u.fetchStatus === "fetching", I = p === "pending", O = p === "error", E = I && F, b = m !== void 0, M = {
      status: p,
      fetchStatus: u.fetchStatus,
      isPending: I,
      isSuccess: p === "success",
      isError: O,
      isInitialLoading: E,
      isLoading: E,
      data: m,
      dataUpdatedAt: u.dataUpdatedAt,
      error: g,
      errorUpdatedAt: w,
      failureCount: u.fetchFailureCount,
      failureReason: u.fetchFailureReason,
      errorUpdateCount: u.errorUpdateCount,
      isFetched: e.isFetched(),
      isFetchedAfterMount: u.dataUpdateCount > l.dataUpdateCount || u.errorUpdateCount > l.errorUpdateCount,
      isFetching: F,
      isRefetching: F && !I,
      isLoadingError: O && !b,
      isPaused: u.fetchStatus === "paused",
      isPlaceholderData: h,
      isRefetchError: O && b,
      isStale: Ps(e, t),
      refetch: this.refetch,
      promise: this.#a,
      isEnabled: Ye(t.enabled, e) !== !1
    };
    if (this.options.experimental_prefetchInRender) {
      const T = M.data !== void 0, $ = M.status === "error" && !T, _ = (me) => {
        $ ? me.reject(M.error) : T && me.resolve(M.data);
      }, pe = () => {
        const me = this.#a = M.promise = us();
        _(me);
      }, De = this.#a;
      switch (De.status) {
        case "pending":
          e.queryHash === n.queryHash && _(De);
          break;
        case "fulfilled":
          ($ || M.data !== De.value) && pe();
          break;
        case "rejected":
          (!$ || M.error !== De.reason) && pe();
          break;
      }
    }
    return M;
  }
  updateResult() {
    const e = this.#r, t = this.createResult(this.#t, this.options);
    if (this.#i = this.#t.state, this.#s = this.options, this.#i.data !== void 0 && (this.#p = this.#t), hr(t, e))
      return;
    this.#r = t;
    const n = () => {
      if (!e)
        return !0;
      const { notifyOnChangeProps: r } = this.options, s = typeof r == "function" ? r() : r;
      if (s === "all" || !s && !this.#g.size)
        return !0;
      const i = new Set(
        s ?? this.#g
      );
      return this.options.throwOnError && i.add("error"), Object.keys(this.#r).some((o) => {
        const a = o;
        return this.#r[a] !== e[a] && i.has(a);
      });
    };
    this.#V({ listeners: n() });
  }
  #x() {
    const e = this.#e.getQueryCache().build(this.#e, this.options);
    if (e === this.#t)
      return;
    const t = this.#t;
    this.#t = e, this.#n = e.state, this.hasListeners() && (t?.removeObserver(this), e.addObserver(this));
  }
  onQueryUpdate() {
    this.updateResult(), this.hasListeners() && this.#w();
  }
  #V(e) {
    Me.batch(() => {
      e.listeners && this.listeners.forEach((t) => {
        t(this.#r);
      }), this.#e.getQueryCache().notify({
        query: this.#t,
        type: "observerResultsUpdated"
      });
    });
  }
};
function Bu(e, t) {
  return Ye(t.enabled, e) !== !1 && e.state.data === void 0 && !(e.state.status === "error" && Ye(t.retryOnMount, e) === !1);
}
function Gi(e, t) {
  return Bu(e, t) || e.state.data !== void 0 && hs(e, t, t.refetchOnMount);
}
function hs(e, t, n) {
  if (Ye(t.enabled, e) !== !1 && Mt(t.staleTime, e) !== "static") {
    const r = typeof n == "function" ? n(e) : n;
    return r === "always" || r !== !1 && Ps(e, t);
  }
  return !1;
}
function Ti(e, t, n, r) {
  return (e !== t || Ye(r.enabled, e) === !1) && (!n.suspense || e.state.status !== "error") && Ps(e, n);
}
function Ps(e, t) {
  return Ye(t.enabled, e) !== !1 && e.isStaleByTime(Mt(t.staleTime, e));
}
function ku(e, t) {
  return !hr(e.getCurrentResult(), t);
}
var Ru = class extends ca {
  #e;
  #t;
  #n;
  #r;
  constructor(e) {
    super(), this.#e = e.client, this.mutationId = e.mutationId, this.#n = e.mutationCache, this.#t = [], this.state = e.state || fa(), this.setOptions(e.options), this.scheduleGc();
  }
  setOptions(e) {
    this.options = e, this.updateGcTime(this.options.gcTime);
  }
  get meta() {
    return this.options.meta;
  }
  addObserver(e) {
    this.#t.includes(e) || (this.#t.push(e), this.clearGcTimeout(), this.#n.notify({
      type: "observerAdded",
      mutation: this,
      observer: e
    }));
  }
  removeObserver(e) {
    this.#t = this.#t.filter((t) => t !== e), this.scheduleGc(), this.#n.notify({
      type: "observerRemoved",
      mutation: this,
      observer: e
    });
  }
  optionalRemove() {
    this.#t.length || (this.state.status === "pending" ? this.scheduleGc() : this.#n.remove(this));
  }
  continue() {
    return this.#r?.continue() ?? // continuing a mutation assumes that variables are set, mutation must have been dehydrated before
    this.execute(this.state.variables);
  }
  async execute(e) {
    const t = () => {
      this.#i({ type: "continue" });
    }, n = {
      client: this.#e,
      meta: this.options.meta,
      mutationKey: this.options.mutationKey
    };
    this.#r = la({
      fn: () => this.options.mutationFn ? this.options.mutationFn(e, n) : Promise.reject(new Error("No mutationFn found")),
      onFail: (i, o) => {
        this.#i({ type: "failed", failureCount: i, error: o });
      },
      onPause: () => {
        this.#i({ type: "pause" });
      },
      onContinue: t,
      retry: this.options.retry ?? 0,
      retryDelay: this.options.retryDelay,
      networkMode: this.options.networkMode,
      canRun: () => this.#n.canRun(this)
    });
    const r = this.state.status === "pending", s = !this.#r.canStart();
    try {
      if (r)
        t();
      else {
        this.#i({ type: "pending", variables: e, isPaused: s }), this.#n.config.onMutate && await this.#n.config.onMutate(
          e,
          this,
          n
        );
        const o = await this.options.onMutate?.(
          e,
          n
        );
        o !== this.state.context && this.#i({
          type: "pending",
          context: o,
          variables: e,
          isPaused: s
        });
      }
      const i = await this.#r.start();
      return await this.#n.config.onSuccess?.(
        i,
        e,
        this.state.context,
        this,
        n
      ), await this.options.onSuccess?.(
        i,
        e,
        this.state.context,
        n
      ), await this.#n.config.onSettled?.(
        i,
        null,
        this.state.variables,
        this.state.context,
        this,
        n
      ), await this.options.onSettled?.(
        i,
        null,
        e,
        this.state.context,
        n
      ), this.#i({ type: "success", data: i }), i;
    } catch (i) {
      try {
        await this.#n.config.onError?.(
          i,
          e,
          this.state.context,
          this,
          n
        );
      } catch (o) {
        Promise.reject(o);
      }
      try {
        await this.options.onError?.(
          i,
          e,
          this.state.context,
          n
        );
      } catch (o) {
        Promise.reject(o);
      }
      try {
        await this.#n.config.onSettled?.(
          void 0,
          i,
          this.state.variables,
          this.state.context,
          this,
          n
        );
      } catch (o) {
        Promise.reject(o);
      }
      try {
        await this.options.onSettled?.(
          void 0,
          i,
          e,
          this.state.context,
          n
        );
      } catch (o) {
        Promise.reject(o);
      }
      throw this.#i({ type: "error", error: i }), i;
    } finally {
      this.#n.runNext(this);
    }
  }
  #i(e) {
    const t = (n) => {
      switch (e.type) {
        case "failed":
          return {
            ...n,
            failureCount: e.failureCount,
            failureReason: e.error
          };
        case "pause":
          return {
            ...n,
            isPaused: !0
          };
        case "continue":
          return {
            ...n,
            isPaused: !1
          };
        case "pending":
          return {
            ...n,
            context: e.context,
            data: void 0,
            failureCount: 0,
            failureReason: null,
            error: null,
            isPaused: e.isPaused,
            status: "pending",
            variables: e.variables,
            submittedAt: Date.now()
          };
        case "success":
          return {
            ...n,
            data: e.data,
            failureCount: 0,
            failureReason: null,
            error: null,
            status: "success",
            isPaused: !1
          };
        case "error":
          return {
            ...n,
            data: void 0,
            error: e.error,
            failureCount: n.failureCount + 1,
            failureReason: e.error,
            isPaused: !1,
            status: "error"
          };
      }
    };
    this.state = t(this.state), Me.batch(() => {
      this.#t.forEach((n) => {
        n.onMutationUpdate(e);
      }), this.#n.notify({
        mutation: this,
        type: "updated",
        action: e
      });
    });
  }
};
function fa() {
  return {
    context: void 0,
    data: void 0,
    error: null,
    failureCount: 0,
    failureReason: null,
    isPaused: !1,
    status: "idle",
    variables: void 0,
    submittedAt: 0
  };
}
var ha = class extends on {
  constructor(t = {}) {
    super(), this.config = t, this.#e = /* @__PURE__ */ new Set(), this.#t = /* @__PURE__ */ new Map(), this.#n = 0;
  }
  #e;
  #t;
  #n;
  build(t, n, r) {
    const s = new Ru({
      client: t,
      mutationCache: this,
      mutationId: ++this.#n,
      options: t.defaultMutationOptions(n),
      state: r
    });
    return this.add(s), s;
  }
  add(t) {
    this.#e.add(t);
    const n = Wn(t);
    if (typeof n == "string") {
      const r = this.#t.get(n);
      r ? r.push(t) : this.#t.set(n, [t]);
    }
    this.notify({ type: "added", mutation: t });
  }
  remove(t) {
    if (this.#e.delete(t)) {
      const n = Wn(t);
      if (typeof n == "string") {
        const r = this.#t.get(n);
        if (r)
          if (r.length > 1) {
            const s = r.indexOf(t);
            s !== -1 && r.splice(s, 1);
          } else r[0] === t && this.#t.delete(n);
      }
    }
    this.notify({ type: "removed", mutation: t });
  }
  canRun(t) {
    const n = Wn(t);
    if (typeof n == "string") {
      const s = this.#t.get(n)?.find(
        (i) => i.state.status === "pending"
      );
      return !s || s === t;
    } else
      return !0;
  }
  runNext(t) {
    const n = Wn(t);
    return typeof n == "string" ? this.#t.get(n)?.find((s) => s !== t && s.state.isPaused)?.continue() ?? Promise.resolve() : Promise.resolve();
  }
  clear() {
    Me.batch(() => {
      this.#e.forEach((t) => {
        this.notify({ type: "removed", mutation: t });
      }), this.#e.clear(), this.#t.clear();
    });
  }
  getAll() {
    return Array.from(this.#e);
  }
  find(t) {
    const n = { exact: !0, ...t };
    return this.getAll().find(
      (r) => Ri(n, r)
    );
  }
  findAll(t = {}) {
    return this.getAll().filter((n) => Ri(t, n));
  }
  notify(t) {
    Me.batch(() => {
      this.listeners.forEach((n) => {
        n(t);
      });
    });
  }
  resumePausedMutations() {
    const t = this.getAll().filter((n) => n.state.isPaused);
    return Me.batch(
      () => Promise.all(
        t.map((n) => n.continue().catch(We))
      )
    );
  }
};
function Wn(e) {
  return e.options.scope?.id;
}
var Fu = class extends on {
  #e;
  #t = void 0;
  #n;
  #r;
  constructor(t, n) {
    super(), this.#e = t, this.setOptions(n), this.bindMethods(), this.#i();
  }
  bindMethods() {
    this.mutate = this.mutate.bind(this), this.reset = this.reset.bind(this);
  }
  setOptions(t) {
    const n = this.options;
    this.options = this.#e.defaultMutationOptions(t), hr(this.options, n) || this.#e.getMutationCache().notify({
      type: "observerOptionsUpdated",
      mutation: this.#n,
      observer: this
    }), n?.mutationKey && this.options.mutationKey && Jt(n.mutationKey) !== Jt(this.options.mutationKey) ? this.reset() : this.#n?.state.status === "pending" && this.#n.setOptions(this.options);
  }
  onUnsubscribe() {
    this.hasListeners() || this.#n?.removeObserver(this);
  }
  onMutationUpdate(t) {
    this.#i(), this.#s(t);
  }
  getCurrentResult() {
    return this.#t;
  }
  reset() {
    this.#n?.removeObserver(this), this.#n = void 0, this.#i(), this.#s();
  }
  mutate(t, n) {
    return this.#r = n, this.#n?.removeObserver(this), this.#n = this.#e.getMutationCache().build(this.#e, this.options), this.#n.addObserver(this), this.#n.execute(t);
  }
  #i() {
    const t = this.#n?.state ?? fa();
    this.#t = {
      ...t,
      isPending: t.status === "pending",
      isSuccess: t.status === "success",
      isError: t.status === "error",
      isIdle: t.status === "idle",
      mutate: this.mutate,
      reset: this.reset
    };
  }
  #s(t) {
    Me.batch(() => {
      if (this.#r && this.hasListeners()) {
        const n = this.#t.variables, r = this.#t.context, s = {
          client: this.#e,
          meta: this.options.meta,
          mutationKey: this.options.mutationKey
        };
        if (t?.type === "success") {
          try {
            this.#r.onSuccess?.(
              t.data,
              n,
              r,
              s
            );
          } catch (i) {
            Promise.reject(i);
          }
          try {
            this.#r.onSettled?.(
              t.data,
              null,
              n,
              r,
              s
            );
          } catch (i) {
            Promise.reject(i);
          }
        } else if (t?.type === "error") {
          try {
            this.#r.onError?.(
              t.error,
              n,
              r,
              s
            );
          } catch (i) {
            Promise.reject(i);
          }
          try {
            this.#r.onSettled?.(
              void 0,
              t.error,
              n,
              r,
              s
            );
          } catch (i) {
            Promise.reject(i);
          }
        }
      }
      this.listeners.forEach((n) => {
        n(this.#t);
      });
    });
  }
}, da = class extends on {
  constructor(t = {}) {
    super(), this.config = t, this.#e = /* @__PURE__ */ new Map();
  }
  #e;
  build(t, n, r) {
    const s = n.queryKey, i = n.queryHash ?? Ts(s, n);
    let o = this.get(i);
    return o || (o = new Iu({
      client: t,
      queryKey: s,
      queryHash: i,
      options: t.defaultQueryOptions(n),
      state: r,
      defaultOptions: t.getQueryDefaults(s)
    }), this.add(o)), o;
  }
  add(t) {
    this.#e.has(t.queryHash) || (this.#e.set(t.queryHash, t), this.notify({
      type: "added",
      query: t
    }));
  }
  remove(t) {
    const n = this.#e.get(t.queryHash);
    n && (t.destroy(), n === t && this.#e.delete(t.queryHash), this.notify({ type: "removed", query: t }));
  }
  clear() {
    Me.batch(() => {
      this.getAll().forEach((t) => {
        this.remove(t);
      });
    });
  }
  get(t) {
    return this.#e.get(t);
  }
  getAll() {
    return [...this.#e.values()];
  }
  find(t) {
    const n = { exact: !0, ...t };
    return this.getAll().find(
      (r) => ki(n, r)
    );
  }
  findAll(t = {}) {
    const n = this.getAll();
    return Object.keys(t).length > 0 ? n.filter((r) => ki(t, r)) : n;
  }
  notify(t) {
    Me.batch(() => {
      this.listeners.forEach((n) => {
        n(t);
      });
    });
  }
  onFocus() {
    Me.batch(() => {
      this.getAll().forEach((t) => {
        t.onFocus();
      });
    });
  }
  onOnline() {
    Me.batch(() => {
      this.getAll().forEach((t) => {
        t.onOnline();
      });
    });
  }
}, Qu = class {
  #e;
  #t;
  #n;
  #r;
  #i;
  #s;
  #a;
  #o;
  constructor(t = {}) {
    this.#e = t.queryCache || new da(), this.#t = t.mutationCache || new ha(), this.#n = t.defaultOptions || {}, this.#r = /* @__PURE__ */ new Map(), this.#i = /* @__PURE__ */ new Map(), this.#s = 0;
  }
  mount() {
    this.#s++, this.#s === 1 && (this.#a = Gs.subscribe(async (t) => {
      t && (await this.resumePausedMutations(), this.#e.onFocus());
    }), this.#o = dr.subscribe(async (t) => {
      t && (await this.resumePausedMutations(), this.#e.onOnline());
    }));
  }
  unmount() {
    this.#s--, this.#s === 0 && (this.#a?.(), this.#a = void 0, this.#o?.(), this.#o = void 0);
  }
  isFetching(t) {
    return this.#e.findAll({ ...t, fetchStatus: "fetching" }).length;
  }
  isMutating(t) {
    return this.#t.findAll({ ...t, status: "pending" }).length;
  }
  /**
   * Imperative (non-reactive) way to retrieve data for a QueryKey.
   * Should only be used in callbacks or functions where reading the latest data is necessary, e.g. for optimistic updates.
   *
   * Hint: Do not use this function inside a component, because it won't receive updates.
   * Use `useQuery` to create a `QueryObserver` that subscribes to changes.
   */
  getQueryData(t) {
    const n = this.defaultQueryOptions({ queryKey: t });
    return this.#e.get(n.queryHash)?.state.data;
  }
  ensureQueryData(t) {
    const n = this.defaultQueryOptions(t), r = this.#e.build(this, n), s = r.state.data;
    return s === void 0 ? this.fetchQuery(t) : (t.revalidateIfStale && r.isStaleByTime(Mt(n.staleTime, r)) && this.prefetchQuery(n), Promise.resolve(s));
  }
  getQueriesData(t) {
    return this.#e.findAll(t).map(({ queryKey: n, state: r }) => {
      const s = r.data;
      return [n, s];
    });
  }
  setQueryData(t, n, r) {
    const s = this.defaultQueryOptions({ queryKey: t }), o = this.#e.get(
      s.queryHash
    )?.state.data, a = gu(n, o);
    if (a !== void 0)
      return this.#e.build(this, s).setData(a, { ...r, manual: !0 });
  }
  setQueriesData(t, n, r) {
    return Me.batch(
      () => this.#e.findAll(t).map(({ queryKey: s }) => [
        s,
        this.setQueryData(s, n, r)
      ])
    );
  }
  getQueryState(t) {
    const n = this.defaultQueryOptions({ queryKey: t });
    return this.#e.get(
      n.queryHash
    )?.state;
  }
  removeQueries(t) {
    const n = this.#e;
    Me.batch(() => {
      n.findAll(t).forEach((r) => {
        n.remove(r);
      });
    });
  }
  resetQueries(t, n) {
    const r = this.#e;
    return Me.batch(() => (r.findAll(t).forEach((s) => {
      s.reset();
    }), this.refetchQueries(
      {
        type: "active",
        ...t
      },
      n
    )));
  }
  cancelQueries(t, n = {}) {
    const r = { revert: !0, ...n }, s = Me.batch(
      () => this.#e.findAll(t).map((i) => i.cancel(r))
    );
    return Promise.all(s).then(We).catch(We);
  }
  invalidateQueries(t, n = {}) {
    return Me.batch(() => (this.#e.findAll(t).forEach((r) => {
      r.invalidate();
    }), t?.refetchType === "none" ? Promise.resolve() : this.refetchQueries(
      {
        ...t,
        type: t?.refetchType ?? t?.type ?? "active"
      },
      n
    )));
  }
  refetchQueries(t, n = {}) {
    const r = {
      ...n,
      cancelRefetch: n.cancelRefetch ?? !0
    }, s = Me.batch(
      () => this.#e.findAll(t).filter((i) => !i.isDisabled() && !i.isStatic()).map((i) => {
        let o = i.fetch(void 0, r);
        return r.throwOnError || (o = o.catch(We)), i.state.fetchStatus === "paused" ? Promise.resolve() : o;
      })
    );
    return Promise.all(s).then(We);
  }
  fetchQuery(t) {
    const n = this.defaultQueryOptions(t);
    n.retry === void 0 && (n.retry = !1);
    const r = this.#e.build(this, n);
    return r.isStaleByTime(
      Mt(n.staleTime, r)
    ) ? r.fetch(n) : Promise.resolve(r.state.data);
  }
  prefetchQuery(t) {
    return this.fetchQuery(t).then(We).catch(We);
  }
  fetchInfiniteQuery(t) {
    return t._type = "infinite", this.fetchQuery(t);
  }
  prefetchInfiniteQuery(t) {
    return this.fetchInfiniteQuery(t).then(We).catch(We);
  }
  ensureInfiniteQueryData(t) {
    return t._type = "infinite", this.ensureQueryData(t);
  }
  resumePausedMutations() {
    return dr.isOnline() ? this.#t.resumePausedMutations() : Promise.resolve();
  }
  getQueryCache() {
    return this.#e;
  }
  getMutationCache() {
    return this.#t;
  }
  getDefaultOptions() {
    return this.#n;
  }
  setDefaultOptions(t) {
    this.#n = t;
  }
  setQueryDefaults(t, n) {
    this.#r.set(Jt(t), {
      queryKey: t,
      defaultOptions: n
    });
  }
  getQueryDefaults(t) {
    const n = [...this.#r.values()], r = {};
    return n.forEach((s) => {
      kn(t, s.queryKey) && Object.assign(r, s.defaultOptions);
    }), r;
  }
  setMutationDefaults(t, n) {
    this.#i.set(Jt(t), {
      mutationKey: t,
      defaultOptions: n
    });
  }
  getMutationDefaults(t) {
    const n = [...this.#i.values()], r = {};
    return n.forEach((s) => {
      kn(t, s.mutationKey) && Object.assign(r, s.defaultOptions);
    }), r;
  }
  defaultQueryOptions(t) {
    if (t._defaulted)
      return t;
    const n = {
      ...this.#n.queries,
      ...this.getQueryDefaults(t.queryKey),
      ...t,
      _defaulted: !0
    };
    return n.queryHash || (n.queryHash = Ts(
      n.queryKey,
      n
    )), n.refetchOnReconnect === void 0 && (n.refetchOnReconnect = n.networkMode !== "always"), n.throwOnError === void 0 && (n.throwOnError = !!n.suspense), !n.networkMode && n.persister && (n.networkMode = "offlineFirst"), n.queryFn === Ys && (n.enabled = !1), n;
  }
  defaultMutationOptions(t) {
    return t?._defaulted ? t : {
      ...this.#n.mutations,
      ...t?.mutationKey && this.getMutationDefaults(t.mutationKey),
      ...t,
      _defaulted: !0
    };
  }
  clear() {
    this.#e.clear(), this.#t.clear();
  }
}, Du = "VUE_QUERY_CLIENT";
function pa(e) {
  const t = e ? `:${e}` : "";
  return `${Du}${t}`;
}
function ds(e, t) {
  Object.keys(e).forEach((n) => {
    e[n] = t[n];
  });
}
function ps(e, t, n = "", r = 0) {
  if (t) {
    const s = t(e, n, r);
    if (s === void 0 && /* @__PURE__ */ Ce(e) || s !== void 0)
      return s;
  }
  if (Array.isArray(e))
    return e.map(
      (s, i) => ps(s, t, String(i), r + 1)
    );
  if (typeof e == "object" && Ou(e)) {
    const s = Object.entries(e).map(([i, o]) => [
      i,
      ps(o, t, i, r + 1)
    ]);
    return Object.fromEntries(s);
  }
  return e;
}
function Uu(e, t) {
  return ps(e, t);
}
function z(e, t = !1) {
  return Uu(e, (n, r, s) => {
    if (s === 1 && r === "queryKey")
      return z(n, !0);
    if (t && Gu(n))
      return z(n(), t);
    if (/* @__PURE__ */ Ce(n))
      return z(ee(n), t);
  });
}
function Ou(e) {
  if (Object.prototype.toString.call(e) !== "[object Object]")
    return !1;
  const t = Object.getPrototypeOf(e);
  return t === null || t === Object.prototype;
}
function Gu(e) {
  return typeof e == "function";
}
function Qr(e = "") {
  if (!jl())
    throw new Error(
      "vue-query hooks can only be used inside setup() function or functions that support injection context."
    );
  const t = pa(e), n = Ft(t);
  if (!n)
    throw new Error(
      "No 'queryClient' found in Vue context, use 'VueQueryPlugin' to properly initialize the library."
    );
  return n;
}
var Tu = class extends da {
  find(e) {
    return super.find(z(e));
  }
  findAll(e = {}) {
    return super.findAll(z(e));
  }
}, Yu = class extends ha {
  find(e) {
    return super.find(z(e));
  }
  findAll(e = {}) {
    return super.findAll(z(e));
  }
}, ga = class extends Qu {
  constructor(e = {}) {
    const t = {
      defaultOptions: e.defaultOptions,
      queryCache: e.queryCache || new Tu(),
      mutationCache: e.mutationCache || new Yu()
    };
    super(t), this.isRestoring = /* @__PURE__ */ L(!1);
  }
  isFetching(e = {}) {
    return super.isFetching(z(e));
  }
  isMutating(e = {}) {
    return super.isMutating(z(e));
  }
  getQueryData(e) {
    return super.getQueryData(z(e));
  }
  ensureQueryData(e) {
    return super.ensureQueryData(z(e));
  }
  getQueriesData(e) {
    return super.getQueriesData(z(e));
  }
  setQueryData(e, t, n = {}) {
    return super.setQueryData(
      z(e),
      t,
      z(n)
    );
  }
  setQueriesData(e, t, n = {}) {
    return super.setQueriesData(
      z(e),
      t,
      z(n)
    );
  }
  getQueryState(e) {
    return super.getQueryState(z(e));
  }
  removeQueries(e = {}) {
    return super.removeQueries(z(e));
  }
  resetQueries(e = {}, t = {}) {
    return super.resetQueries(z(e), z(t));
  }
  cancelQueries(e = {}, t = {}) {
    return super.cancelQueries(z(e), z(t));
  }
  invalidateQueries(e = {}, t = {}) {
    const n = z(
      e
    ), r = z(
      t
    );
    if (super.invalidateQueries(
      { ...n, refetchType: "none" },
      r
    ), n.refetchType === "none")
      return Promise.resolve();
    const s = {
      ...n,
      type: n.refetchType ?? n.type ?? "active"
    };
    return qe().then(() => super.refetchQueries(s, r));
  }
  refetchQueries(e = {}, t = {}) {
    return super.refetchQueries(
      z(e),
      z(t)
    );
  }
  fetchQuery(e) {
    return super.fetchQuery(z(e));
  }
  prefetchQuery(e) {
    return super.prefetchQuery(z(e));
  }
  fetchInfiniteQuery(e) {
    return super.fetchInfiniteQuery(z(e));
  }
  prefetchInfiniteQuery(e) {
    return super.prefetchInfiniteQuery(z(e));
  }
  setDefaultOptions(e) {
    super.setDefaultOptions(z(e));
  }
  setQueryDefaults(e, t) {
    super.setQueryDefaults(z(e), z(t));
  }
  getQueryDefaults(e) {
    return super.getQueryDefaults(z(e));
  }
  setMutationDefaults(e, t) {
    super.setMutationDefaults(
      z(e),
      z(t)
    );
  }
  getMutationDefaults(e) {
    return super.getMutationDefaults(z(e));
  }
}, Pu = {
  install: (e, t = {}) => {
    const n = pa(t.queryClientKey);
    let r;
    if ("queryClient" in t && t.queryClient)
      r = t.queryClient;
    else {
      const o = "queryClientConfig" in t ? t.queryClientConfig : void 0;
      r = new ga(o);
    }
    Rn.isServer() || r.mount();
    let s = () => {
    };
    if (t.clientPersister) {
      r.isRestoring && (r.isRestoring.value = !0);
      const [o, a] = t.clientPersister(r);
      s = o, a.then(() => {
        r.isRestoring && (r.isRestoring.value = !1), t.clientPersisterOnSuccess?.(r);
      });
    }
    const i = () => {
      r.unmount(), s();
    };
    if (e.onUnmount)
      e.onUnmount(i);
    else {
      const o = e.unmount;
      e.unmount = function() {
        i(), o();
      };
    }
    e.provide(n, r);
  }
};
function ju(e, t, n) {
  const r = Qr(), s = j(() => {
    let g = t;
    typeof g == "function" && (g = g());
    const w = z(g);
    typeof w.enabled == "function" && (w.enabled = w.enabled());
    const p = r.defaultQueryOptions(w);
    return p._optimisticResults = r.isRestoring?.value ? "isRestoring" : "optimistic", p;
  }), i = new e(r, s.value), o = s.value.shallow ? /* @__PURE__ */ Is(i.getCurrentResult()) : /* @__PURE__ */ Sr(i.getCurrentResult());
  let a = () => {
  };
  r.isRestoring && Oe(
    r.isRestoring,
    (g) => {
      g || (a(), a = i.subscribe((w) => {
        ds(o, w);
      }));
    },
    { immediate: !0 }
  );
  const l = () => {
    i.setOptions(s.value), ds(o, i.getCurrentResult());
  };
  Oe(s, l), ao(() => {
    a();
  });
  const c = (...g) => (l(), o.refetch(...g)), u = () => new Promise(
    (g, w) => {
      let p = () => {
      };
      const R = () => {
        if (s.value.enabled !== !1) {
          i.setOptions(s.value);
          const F = i.getOptimisticResult(
            s.value
          );
          F.isStale ? (p(), i.fetchOptimistic(s.value).then(g, (I) => {
            cs(s.value.throwOnError, [
              I,
              i.getCurrentQuery()
            ]) ? w(I) : g(i.getCurrentResult());
          })) : (p(), g(F));
        }
      };
      R(), p = Oe(s, R);
    }
  );
  Oe(
    () => o.error,
    (g) => {
      if (o.isError && !o.isFetching && cs(s.value.throwOnError, [
        g,
        i.getCurrentQuery()
      ]))
        throw g;
    }
  );
  const h = s.value.shallow ? /* @__PURE__ */ So(o) : /* @__PURE__ */ Sn(o), m = /* @__PURE__ */ Mo(h);
  for (const g in o)
    typeof o[g] == "function" && (m[g] = o[g]);
  return m.suspense = u, m.refetch = c, m;
}
function Ku(e, t) {
  return ju(Mu, e);
}
function ma(e, t) {
  const n = Qr(), r = j(() => {
    const u = typeof e == "function" ? e() : e;
    return n.defaultMutationOptions(z(u));
  }), s = new Fu(n, r.value), i = r.value.shallow ? /* @__PURE__ */ Is(s.getCurrentResult()) : /* @__PURE__ */ Sr(s.getCurrentResult()), o = s.subscribe((u) => {
    ds(i, u);
  }), a = (u, h) => {
    s.mutate(u, h).catch(() => {
    });
  };
  Oe(r, () => {
    s.setOptions(r.value);
  }), ao(() => {
    o();
  });
  const l = r.value.shallow ? /* @__PURE__ */ So(i) : /* @__PURE__ */ Sn(i), c = /* @__PURE__ */ Mo(l);
  return Oe(
    () => i.error,
    (u) => {
      if (u && cs(r.value.throwOnError, [u]))
        throw u;
    }
  ), {
    ...c,
    mutate: a,
    mutateAsync: i.mutate,
    reset: i.reset
  };
}
const qn = {
  market: {
    buttonColor: "linear-gradient(140deg, #881AFF 12.89%, #5E16D9 50.9%, #3B0C8A 85.42%)",
    gradientColors: ["#00010D", "#8E3AEF", "#5E0056", "#0B0C19", "#AB218D", "#000DFF"],
    gradientLogo: ["#881AFF", "#5E16D9", "#3B0C8A", "#881AFF", "#5E16D9", "#3B0C8A"],
    mainAccent: "#8041ff"
  },
  news: {
    buttonColor: "linear-gradient(218deg, #27D1F9 12.75%, #02B4FE 51.95%, #1854FD 90.38%)",
    gradientColors: ["#00010D", "#3ACBEF", "#00495E", "#000E2F", "#2189AB", "#000DFF"],
    gradientLogo: ["#27D1F9", "#02B4FE", "#1854FD", "#27D1F9", "#02B4FE", "#1854FD"],
    mainAccent: "#0EBFF6"
  },
  streaming: {
    buttonColor: "linear-gradient(160deg, #F40307 5.21%, #9B1010 89.35%)",
    gradientColors: ["#00010D", "#9D0003", "#CD1C1F", "#000000", "#AB2128", "#FF0004"],
    gradientLogo: ["#F40307", "#D60A0D", "#9B1010", "#F40307", "#D60A0D", "#9B1010"],
    mainAccent: "#920616"
  },
  mos: {
    buttonColor: "linear-gradient(145deg, #f0c35a 0%, #d4a84b 52%, #a67c2e 100%)",
    gradientColors: ["#0b0b0c", "#d4a84b", "#1a1a1d", "#0b0b0c", "#f0c35a", "#141416"],
    gradientLogo: ["#f0c35a", "#d4a84b", "#a67c2e", "#f0c35a", "#d4a84b", "#a67c2e"],
    mainAccent: "#d4a84b"
  }
};
function Nu(e) {
  const t = j(() => e.sizeClass || "w-[342px] h-[600px]"), n = j(() => "w-[52px] h-[52px] rounded-full"), r = j(() => qn[e.theme].gradientColors), s = j(() => qn[e.theme].gradientLogo), i = j(() => qn[e.theme].mainAccent), o = j(() => qn[e.theme].buttonColor), a = j(() => `flex w-full ${{
    "bottom-right": "justify-end",
    "bottom-left": "justify-start"
  }[e.position || "bottom-right"]}`), l = j(() => "flex flex-col justify-end self-stretch h-[536px] bg-[#0e0f19] p-4");
  return {
    sizeClasses: t,
    gradients: r,
    logoGradients: s,
    buttonClasses: n,
    mainAccent: i,
    buttonContainerClasses: a,
    chatWindowClasses: l,
    buttonBg: o
  };
}
function Lu() {
  const e = /* @__PURE__ */ L(!1), t = /* @__PURE__ */ L(!1), n = /* @__PURE__ */ L(!1), r = /* @__PURE__ */ L(!1), s = /* @__PURE__ */ L("portrait"), i = j(() => s.value === "portrait"), o = j(() => s.value === "landscape"), a = () => {
    const c = window.innerWidth, u = window.innerHeight;
    e.value = c <= 480, t.value = c > 480 && c < 1024, n.value = c >= 1024, s.value = c > u ? "landscape" : "portrait";
    const h = navigator.userAgent, m = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      h
    );
    r.value = e.value && m || c <= 480;
  }, l = () => {
    a();
  };
  return sn(() => {
    a(), window.addEventListener("resize", l);
  }), Yn(() => {
    window.removeEventListener("resize", l);
  }), {
    isMobile: e,
    isTablet: t,
    isDesktop: n,
    shouldUseFullscreen: r,
    orientation: s,
    isPortrait: i,
    isLandscape: o
  };
}
const Wu = "http://127.0.0.1:8084", qu = "ws://127.0.0.1:8084";
let va = Wu, ya = qu;
function Ju(e, t) {
  e && (va = e.replace(/\/$/, "")), t && (ya = t.replace(/\/$/, ""));
}
function Zu() {
  return va;
}
function Hu() {
  return ya;
}
const zu = "/api/v1";
class Xu extends Error {
  constructor(t, n, r) {
    super(t), this.status = n, this.code = r, this.name = "ApiError";
  }
  status;
  code;
}
async function Jn(e, t) {
  const n = `${Zu()}${zu}${e}`, r = await fetch(n, {
    credentials: "include",
    // For SSO cookies
    headers: {
      "Content-Type": "application/json",
      ...t?.headers || {}
    },
    ...t
  });
  if (!r.ok) {
    let s = `HTTP ${r.status}`, i = r.status.toString();
    try {
      const o = await r.text();
      try {
        const a = JSON.parse(o);
        s = a.message, i = a.code;
      } catch {
        s = o || s;
      }
    } catch {
      s = `HTTP ${r.status} ${r.statusText}`;
    }
    throw new Xu(s, r.status, i);
  }
  return r.status === 204 ? null : r.json();
}
const wt = {
  get: (e, t) => {
    const n = t ? `${e}?${new URLSearchParams(t).toString()}` : e;
    return Jn(n, { method: "GET" });
  },
  post: (e, t) => Jn(e, {
    method: "POST",
    body: t ? JSON.stringify(t) : void 0
  }),
  patch: (e, t) => Jn(e, {
    method: "PATCH",
    body: t ? JSON.stringify(t) : void 0
  }),
  delete: (e) => Jn(e, { method: "DELETE" })
}, wa = {
  // POST /conversations
  create: (e) => wt.post("/conversations", e),
  // GET /conversations
  list: (e, t) => wt.get("/conversations", {
    user_id: e,
    limit: t?.toString()
  }),
  // PATCH /conversations/{conversationId}
  updateStatus: (e, t, n) => wt.patch(`/conversations/${e}?user_id=${t}`, { status: n }),
  // PATCH /conversations/{conversationId}/rate
  rate: (e, t, n) => wt.patch(`/conversations/${e}/rate?user_id=${t}`, n)
}, _u = {
  // GET /conversations/{conversationId}/messages - простой запрос всей истории
  getHistory: (e) => wt.get(`/conversations/${e}/messages?limit=100`),
  // POST /conversations/{conversationId}/messages
  send: (e, t) => wt.post(`/conversations/${e}/messages`, t)
}, Yi = {
  // POST /attachments/init
  init: (e, t) => wt.post(
    `/attachments/init?conversation_id=${e}`,
    t
  ),
  // POST /attachments/{attachmentId}/complete
  complete: (e, t) => wt.post(
    `/attachments/${e}/complete?conversation_id=${t}`
  ),
  // GET /attachments/{attachmentId}/download
  getDownloadUrl: (e) => wt.get(`/attachments/${e}/download`)
}, js = {
  conversations: (e) => ["conversations", e],
  messages: (e) => ["messages", e]
};
function $u() {
  const e = Qr();
  return ma({
    mutationFn: (t) => wa.create(t),
    onSuccess: (t, n) => {
      e.setQueryData(js.conversations(n.user.id), (r) => r ? {
        ...r,
        items: [t, ...r.items]
      } : { items: [t] });
    }
  });
}
function ef(e) {
  return Ku({
    queryKey: j(() => js.messages(e.value)),
    queryFn: () => _u.getHistory(e.value),
    enabled: j(() => !!e.value),
    // Сортируем сообщения по seq_no
    select: (t) => ({
      ...t,
      items: t.items.sort((n, r) => n.seq_no - r.seq_no).map((n) => ({ ...n, isReceived: !0 }))
    })
  });
}
function tf() {
  const e = Qr();
  return ma({
    mutationFn: ({
      conversation_id: t,
      user_id: n,
      is_like: r
    }) => wa.rate(t, n, { is_like: r }),
    onSuccess: (t, n) => {
      e.setQueryData(js.conversations(n.user_id), (r) => r && {
        ...r,
        items: r.items.map(
          (s) => s.id === t.id ? t : s
        )
      });
    }
  });
}
function nf({
  userId: e,
  userName: t,
  topic: n,
  needToInitializeChat: r
}) {
  const s = /* @__PURE__ */ L(""), i = /* @__PURE__ */ L(!1), o = /* @__PURE__ */ L(!1), a = /* @__PURE__ */ L(null), l = $u(), {
    data: c,
    isLoading: u,
    refetch: h
  } = ef(s), m = async () => {
    if (!e.value || !t.value) {
      console.warn("[Chat] Missing userId or userName"), a.value = "Missing user credentials";
      return;
    }
    if (o.value) {
      console.warn("[Chat] Already initializing");
      return;
    }
    o.value = !0, a.value = null;
    try {
      console.log("[Chat] Creating new support conversation...");
      const p = await l.mutateAsync({
        type: "support",
        user: {
          id: e.value,
          username: t.value
        },
        source: "web",
        page_url: window.location.href,
        locale: navigator.language,
        timezone: -((/* @__PURE__ */ new Date()).getTimezoneOffset() / 60),
        // Часовой пояс в часах
        app_version: "1.0.0",
        topic: n?.value
      });
      s.value = p.id, await h(), i.value = !0;
    } catch (p) {
      a.value = p instanceof Error ? p.message : "Failed to initialize chat";
    } finally {
      o.value = !1;
    }
  };
  Oe(
    [e, t, r],
    ([p, R, F]) => {
      p && R && !i.value && F && m();
    },
    { immediate: !0 }
  );
  const g = async () => {
    if (!e.value || !t.value)
      throw new Error("Missing user credentials");
    try {
      const p = await l.mutateAsync({
        type: "support",
        user: {
          id: e.value,
          username: `${t.value}_${Math.random().toString(36).substring(2, 8)}`
        },
        source: "web",
        page_url: window.location.href,
        locale: navigator.language,
        timezone: -((/* @__PURE__ */ new Date()).getTimezoneOffset() / 60),
        app_version: "1.0.0"
      });
      return s.value = p.id, console.log("[Chat] Created new conversation for reconnection"), p.id;
    } catch (p) {
      throw console.error("[Chat] Failed to create new conversation:", p), p;
    }
  }, w = j(() => c.value?.items || []);
  return {
    // State
    conversationId: j(() => s.value),
    messageHistory: w,
    isLoading: j(() => o.value),
    isLoadingHistory: j(() => u.value),
    isInitialized: j(() => i.value),
    error: j(() => a.value),
    // Actions
    initializeChat: m,
    refetchHistory: h,
    createNewConversation: g
  };
}
const rf = {
  xmlns: "http://www.w3.org/2000/svg",
  width: "24",
  height: "24",
  fill: "none"
};
function sf(e, t) {
  return D(), Y("svg", rf, [...t[0] || (t[0] = [
    y("path", {
      fill: "#FAFAFA",
      "fill-rule": "evenodd",
      d: "M4.804 21.644A6.7 6.7 0 0 0 6 21.75a6.7 6.7 0 0 0 3.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9S17.322 3 12 3s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 0 1-.814 1.686.75.75 0 0 0 .44 1.223M8.25 10.875a1.125 1.125 0 1 0 0 2.25 1.125 1.125 0 0 0 0-2.25M10.875 12a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0m4.875-1.125a1.125 1.125 0 1 0 0 2.25 1.125 1.125 0 0 0 0-2.25",
      "clip-rule": "evenodd"
    }, null, -1)
  ])]);
}
const of = { render: sf }, af = {
  width: "100%",
  height: "100%",
  viewBox: "0 0 342 536",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  preserveAspectRatio: "none",
  class: "w-full h-full"
}, lf = {
  opacity: "0.5",
  "clip-path": "url(#clip0_7159_6346)"
}, cf = ["fill"], uf = { filter: "url(#filter0_f_7159_6346)" }, ff = ["fill"], hf = { filter: "url(#filter1_f_7159_6346)" }, df = ["fill"], pf = { filter: "url(#filter2_f_7159_6346)" }, gf = ["fill"], mf = {
  id: "paint0_linear_7159_6346",
  x1: "-1.48014",
  y1: "315.76",
  x2: "364.847",
  y2: "-209.406",
  gradientUnits: "userSpaceOnUse"
}, vf = ["stop-color"], yf = ["stop-color"], wf = /* @__PURE__ */ ke({
  __name: "ChatBgGradients",
  props: {
    gradients: { default: () => ["#00010D", "#8E3AEF", "#5E0056", "#0B0C19", "#AB218D", "#000DFF"] }
  },
  setup(e) {
    const t = e;
    return (n, r) => (D(), Y("svg", af, [
      y("g", lf, [
        y("rect", {
          width: "342",
          height: "536",
          fill: t.gradients[0]
        }, null, 8, cf),
        y("g", uf, [
          y("path", {
            "fill-rule": "evenodd",
            "clip-rule": "evenodd",
            d: "M106.519 -239.222C173.512 -234.527 223.196 -196.862 267.401 -159.832C307.71 -126.066 347.223 -87.0191 341.433 -42.4397C335.955 -0.26062 284.506 27.8164 239.547 54.6281C173.769 93.8559 -33.6314 153.788 -104.502 111.537C-161.492 77.5614 -131.362 11.2185 -128.474 -42.4397C-125.765 -92.746 -133.876 -146.819 -88.5489 -184.776C-41.0044 -224.59 34.4785 -244.27 106.519 -239.222Z",
            fill: t.gradients[1]
          }, null, 8, ff)
        ]),
        y("g", hf, [
          y("path", {
            "fill-rule": "evenodd",
            "clip-rule": "evenodd",
            d: "M20.381 564.307C97.2171 534.816 170.704 442.643 243.613 492.725C317.668 543.595 307.983 664.528 303.395 758.712C299.639 835.798 269.137 901.143 221.177 953.239C168.172 1010.81 106.177 1068.01 30.1391 1055.53C-51.4216 1042.14 -123.827 975.296 -160.742 890.537C-250.647 684.106 -112.651 615.367 20.381 564.307Z",
            fill: t.gradients[2]
          }, null, 8, df)
        ]),
        y("g", pf, [
          y("path", {
            "fill-rule": "evenodd",
            "clip-rule": "evenodd",
            d: "M25.2143 -73.4314C199.759 -97.524 363.631 -69.855 307.933 94.0205C291.29 142.988 207.81 155.789 162.587 194.012C109.401 238.967 106.696 331.553 25.2143 332.983C-55.7983 334.404 -72.8448 247.462 -118.945 198.952C-151.73 164.453 -199.772 135.941 -201.877 94.0205C-206.427 3.40264 -83.9232 -58.367 25.2143 -73.4314Z",
            fill: t.gradients[3]
          }, null, 8, gf)
        ]),
        r[0] || (r[0] = y("g", { filter: "url(#filter3_f_7159_6346)" }, [
          y("path", {
            "fill-rule": "evenodd",
            "clip-rule": "evenodd",
            d: "M298.483 162.2C226.203 213.598 262.562 135.244 195.955 172.524C135.996 206.083 65.6882 299.786 16.6815 319.925C-27.7672 338.192 87.3425 238.901 96.0002 213.602C101.587 197.277 31.1021 234.411 55.0107 207.919C81.5222 178.544 137.067 151.934 179.197 121.418C199.385 106.794 219.469 91.7957 236.816 76.2271C291.232 27.3883 323.831 -20.9323 387.347 -65.3994C441.567 -103.359 503.072 -128.043 502.984 -110.117C502.83 -78.7056 357.439 31.1466 329.091 77.8506C307.487 113.444 364.271 115.418 298.483 162.2Z",
            fill: "url(#paint0_linear_7159_6346)"
          })
        ], -1))
      ]),
      y("defs", null, [
        r[1] || (r[1] = xc('<filter id="filter0_f_7159_6346" x="-389" y="-490" width="981" height="866" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"></feFlood><feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"></feBlend><feGaussianBlur stdDeviation="125" result="effect1_foregroundBlur_7159_6346"></feGaussianBlur></filter><filter id="filter1_f_7159_6346" x="-339.471" y="328.093" width="795.977" height="879.169" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"></feFlood><feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"></feBlend><feGaussianBlur stdDeviation="75" result="effect1_foregroundBlur_7159_6346"></feGaussianBlur></filter><filter id="filter2_f_7159_6346" x="-352" y="-231" width="821" height="714" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"></feFlood><feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"></feBlend><feGaussianBlur stdDeviation="75" result="effect1_foregroundBlur_7159_6346"></feGaussianBlur></filter><filter id="filter3_f_7159_6346" x="-143.49" y="-266.081" width="796.474" height="738.235" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"></feFlood><feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"></feBlend><feGaussianBlur stdDeviation="75" result="effect1_foregroundBlur_7159_6346"></feGaussianBlur></filter>', 4)),
        y("linearGradient", mf, [
          y("stop", {
            "stop-color": t.gradients[4]
          }, null, 8, vf),
          y("stop", {
            offset: "1",
            "stop-color": t.gradients[5]
          }, null, 8, yf)
        ]),
        r[2] || (r[2] = y("clipPath", { id: "clip0_7159_6346" }, [
          y("rect", {
            width: "342",
            height: "536",
            fill: "white"
          })
        ], -1))
      ])
    ]));
  }
}), bf = {
  id: "header",
  class: "w-full h-[18px] flex justify-center items-center"
}, Af = {
  class: "flex justify-center items-center gap-2.5 px-1 pb-0.5 rounded-[100px]",
  style: { background: "rgba(108, 111, 172, 0.08)" }
}, xf = { class: "font-normal text-xs text-slate-500 font-golos" }, Vf = /* @__PURE__ */ ke({
  __name: "ChatHeader",
  props: {
    visibleMessageDate: {}
  },
  setup(e) {
    const t = e, n = (s) => {
      if (!s) return "Сегодня";
      const i = typeof s == "string" ? new Date(s) : s, o = /* @__PURE__ */ new Date(), a = new Date(o.getFullYear(), o.getMonth(), o.getDate()), l = new Date(i.getFullYear(), i.getMonth(), i.getDate()), c = a.getTime() - l.getTime(), u = Math.floor(c / (1e3 * 60 * 60 * 24));
      return u === 0 ? "Сегодня" : u === 1 ? "Вчера" : i.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long"
      });
    }, r = j(() => n(t.visibleMessageDate));
    return (s, i) => (D(), Y("div", bf, [
      y("div", Af, [
        y("span", xf, Se(r.value), 1)
      ])
    ]));
  }
}), Cf = {
  xmlns: "http://www.w3.org/2000/svg",
  width: "24",
  height: "24",
  fill: "none"
};
function Sf(e, t) {
  return D(), Y("svg", Cf, [...t[0] || (t[0] = [
    y("path", {
      stroke: "currentColor",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "stroke-width": "1.5",
      d: "m14 7.333-5.333 5.334a1.886 1.886 0 0 0 2.667 2.666L16.667 10a3.771 3.771 0 0 0-5.334-5.333L6 10a5.657 5.657 0 0 0 8 8l5.334-5.333"
    }, null, -1)
  ])]);
}
const Ef = { render: Sf }, If = {
  xmlns: "http://www.w3.org/2000/svg",
  width: "24",
  height: "24",
  fill: "none"
};
function Mf(e, t) {
  return D(), Y("svg", If, [...t[0] || (t[0] = [
    y("path", {
      fill: "currentColor",
      d: "m9.51 4.23 8.56 4.28c3.84 1.92 3.84 5.06 0 6.98l-8.56 4.28c-5.76 2.88-8.11.52-5.23-5.23l.87-1.73c.22-.44.22-1.17 0-1.61l-.87-1.74C1.4 3.71 3.76 1.35 9.51 4.23"
    }, null, -1),
    y("path", {
      stroke: "#271436",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "stroke-width": "1.5",
      d: "M5.44 12h5.4"
    }, null, -1)
  ])]);
}
const Bf = { render: Mf }, kf = {
  xmlns: "http://www.w3.org/2000/svg",
  width: "24",
  height: "24",
  fill: "none"
};
function Rf(e, t) {
  return D(), Y("svg", kf, [...t[0] || (t[0] = [
    y("path", {
      fill: "#FAFAFA",
      "fill-rule": "evenodd",
      d: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10m-2.505-5.436a.75.75 0 0 1-.993-1.125l.275-.21c.162-.114.395-.26.693-.404A5.8 5.8 0 0 1 12 14.25a5.8 5.8 0 0 1 2.53.575 5 5 0 0 1 .885.545l.083.07a.75.75 0 0 1-.992 1.124l-.14-.105a4 4 0 0 0-.49-.284A4.3 4.3 0 0 0 12 15.75a4.3 4.3 0 0 0-1.876.425c-.218.105-.383.21-.49.284zM17 10a1 1 0 1 1-2 0 1 1 0 0 1 2 0m-9 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2",
      "clip-rule": "evenodd"
    }, null, -1)
  ])]);
}
const Ff = { render: Rf }, Qf = (e, t) => {
  const n = e.__vccOpts || e;
  for (const [r, s] of t)
    n[r] = s;
  return n;
}, Df = {}, Uf = {
  xmlns: "http://www.w3.org/2000/svg",
  width: "24",
  height: "24",
  viewBox: "0 0 24 24",
  fill: "none"
};
function Of(e, t) {
  return D(), Y("svg", Uf, [...t[0] || (t[0] = [
    y("path", {
      d: "M12.62 20.81C12.28 20.93 11.72 20.93 11.38 20.81C8.48 19.82 2 15.69 2 8.68998C2 5.59998 4.49 3.09998 7.56 3.09998C9.38 3.09998 10.99 3.97998 12 5.33998C13.01 3.97998 14.63 3.09998 16.44 3.09998C19.51 3.09998 22 5.59998 22 8.68998C22 15.69 15.52 19.82 12.62 20.81Z",
      fill: "url(#paint0_linear_13111_14740)"
    }, null, -1),
    y("defs", null, [
      y("linearGradient", {
        id: "paint0_linear_13111_14740",
        x1: "8.11111",
        y1: "2.35831",
        x2: "14.2043",
        y2: "20.8686",
        gradientUnits: "userSpaceOnUse"
      }, [
        y("stop", { "stop-color": "#F40307" }),
        y("stop", {
          offset: "1",
          "stop-color": "#9B1010"
        })
      ])
    ], -1)
  ])]);
}
const Gf = /* @__PURE__ */ Qf(Df, [["render", Of]]), Tf = {
  xmlns: "http://www.w3.org/2000/svg",
  width: "24",
  height: "24",
  fill: "none"
};
function Yf(e, t) {
  return D(), Y("svg", Tf, [...t[0] || (t[0] = [
    y("path", {
      stroke: "currentColor",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "stroke-width": "1.5",
      d: "M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75m-.375 0h.008v.015h-.008zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75m-.375 0h.008v.015h-.008z"
    }, null, -1)
  ])]);
}
const Pf = { render: Yf };
var Pi;
let jf = /* @__PURE__ */ Symbol("headlessui.useid"), Kf = 0;
const xn = (Pi = ql) != null ? Pi : function() {
  return Ft(jf, () => `${++Kf}`)();
};
function W(e) {
  var t;
  if (e == null || e.value == null) return null;
  let n = (t = e.value.$el) != null ? t : e.value;
  return n instanceof Node ? n : null;
}
function Ct(e, t, ...n) {
  if (e in t) {
    let s = t[e];
    return typeof s == "function" ? s(...n) : s;
  }
  let r = new Error(`Tried to handle "${e}" but there is no handler defined. Only defined handlers are: ${Object.keys(t).map((s) => `"${s}"`).join(", ")}.`);
  throw Error.captureStackTrace && Error.captureStackTrace(r, Ct), r;
}
var Nf = Object.defineProperty, Lf = (e, t, n) => t in e ? Nf(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n, ji = (e, t, n) => (Lf(e, typeof t != "symbol" ? t + "" : t, n), n);
let Wf = class {
  constructor() {
    ji(this, "current", this.detect()), ji(this, "currentId", 0);
  }
  set(t) {
    this.current !== t && (this.currentId = 0, this.current = t);
  }
  reset() {
    this.set(this.detect());
  }
  nextId() {
    return ++this.currentId;
  }
  get isServer() {
    return this.current === "server";
  }
  get isClient() {
    return this.current === "client";
  }
  detect() {
    return typeof window > "u" || typeof document > "u" ? "server" : "client";
  }
}, Dr = new Wf();
function Pn(e) {
  if (Dr.isServer) return null;
  if (e instanceof Node) return e.ownerDocument;
  if (e != null && e.hasOwnProperty("value")) {
    let t = W(e);
    if (t) return t.ownerDocument;
  }
  return document;
}
let gs = ["[contentEditable=true]", "[tabindex]", "a[href]", "area[href]", "button:not([disabled])", "iframe", "input:not([disabled])", "select:not([disabled])", "textarea:not([disabled])"].map((e) => `${e}:not([tabindex='-1'])`).join(",");
var bt = ((e) => (e[e.First = 1] = "First", e[e.Previous = 2] = "Previous", e[e.Next = 4] = "Next", e[e.Last = 8] = "Last", e[e.WrapAround = 16] = "WrapAround", e[e.NoScroll = 32] = "NoScroll", e))(bt || {}), pr = ((e) => (e[e.Error = 0] = "Error", e[e.Overflow = 1] = "Overflow", e[e.Success = 2] = "Success", e[e.Underflow = 3] = "Underflow", e))(pr || {}), qf = ((e) => (e[e.Previous = -1] = "Previous", e[e.Next = 1] = "Next", e))(qf || {});
function Ur(e = document.body) {
  return e == null ? [] : Array.from(e.querySelectorAll(gs)).sort((t, n) => Math.sign((t.tabIndex || Number.MAX_SAFE_INTEGER) - (n.tabIndex || Number.MAX_SAFE_INTEGER)));
}
var Ks = ((e) => (e[e.Strict = 0] = "Strict", e[e.Loose = 1] = "Loose", e))(Ks || {});
function ba(e, t = 0) {
  var n;
  return e === ((n = Pn(e)) == null ? void 0 : n.body) ? !1 : Ct(t, { 0() {
    return e.matches(gs);
  }, 1() {
    let r = e;
    for (; r !== null; ) {
      if (r.matches(gs)) return !0;
      r = r.parentElement;
    }
    return !1;
  } });
}
var Jf = ((e) => (e[e.Keyboard = 0] = "Keyboard", e[e.Mouse = 1] = "Mouse", e))(Jf || {});
typeof window < "u" && typeof document < "u" && (document.addEventListener("keydown", (e) => {
  e.metaKey || e.altKey || e.ctrlKey || (document.documentElement.dataset.headlessuiFocusVisible = "");
}, !0), document.addEventListener("click", (e) => {
  e.detail === 1 ? delete document.documentElement.dataset.headlessuiFocusVisible : e.detail === 0 && (document.documentElement.dataset.headlessuiFocusVisible = "");
}, !0));
let Zf = ["textarea", "input"].join(",");
function Hf(e) {
  var t, n;
  return (n = (t = e?.matches) == null ? void 0 : t.call(e, Zf)) != null ? n : !1;
}
function zf(e, t = (n) => n) {
  return e.slice().sort((n, r) => {
    let s = t(n), i = t(r);
    if (s === null || i === null) return 0;
    let o = s.compareDocumentPosition(i);
    return o & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : o & Node.DOCUMENT_POSITION_PRECEDING ? 1 : 0;
  });
}
function Yt(e, t, { sorted: n = !0, relativeTo: r = null, skipElements: s = [] } = {}) {
  var i;
  let o = (i = Array.isArray(e) ? e.length > 0 ? e[0].ownerDocument : document : e?.ownerDocument) != null ? i : document, a = Array.isArray(e) ? n ? zf(e) : e : Ur(e);
  s.length > 0 && a.length > 1 && (a = a.filter((w) => !s.includes(w))), r = r ?? o.activeElement;
  let l = (() => {
    if (t & 5) return 1;
    if (t & 10) return -1;
    throw new Error("Missing Focus.First, Focus.Previous, Focus.Next or Focus.Last");
  })(), c = (() => {
    if (t & 1) return 0;
    if (t & 2) return Math.max(0, a.indexOf(r)) - 1;
    if (t & 4) return Math.max(0, a.indexOf(r)) + 1;
    if (t & 8) return a.length - 1;
    throw new Error("Missing Focus.First, Focus.Previous, Focus.Next or Focus.Last");
  })(), u = t & 32 ? { preventScroll: !0 } : {}, h = 0, m = a.length, g;
  do {
    if (h >= m || h + m <= 0) return 0;
    let w = c + h;
    if (t & 16) w = (w + m) % m;
    else {
      if (w < 0) return 3;
      if (w >= m) return 1;
    }
    g = a[w], g?.focus(u), h += l;
  } while (g !== o.activeElement);
  return t & 6 && Hf(g) && g.select(), 2;
}
function Xf() {
  return /iPhone/gi.test(window.navigator.platform) || /Mac/gi.test(window.navigator.platform) && window.navigator.maxTouchPoints > 0;
}
function _f() {
  return /Android/gi.test(window.navigator.userAgent);
}
function $f() {
  return Xf() || _f();
}
function Zn(e, t, n) {
  Dr.isServer || Qt((r) => {
    document.addEventListener(e, t, n), r(() => document.removeEventListener(e, t, n));
  });
}
function Aa(e, t, n) {
  Dr.isServer || Qt((r) => {
    window.addEventListener(e, t, n), r(() => window.removeEventListener(e, t, n));
  });
}
function eh(e, t, n = j(() => !0)) {
  function r(i, o) {
    if (!n.value || i.defaultPrevented) return;
    let a = o(i);
    if (a === null || !a.getRootNode().contains(a)) return;
    let l = (function c(u) {
      return typeof u == "function" ? c(u()) : Array.isArray(u) || u instanceof Set ? u : [u];
    })(e);
    for (let c of l) {
      if (c === null) continue;
      let u = c instanceof HTMLElement ? c : W(c);
      if (u != null && u.contains(a) || i.composed && i.composedPath().includes(u)) return;
    }
    return !ba(a, Ks.Loose) && a.tabIndex !== -1 && i.preventDefault(), t(i, a);
  }
  let s = /* @__PURE__ */ L(null);
  Zn("pointerdown", (i) => {
    var o, a;
    n.value && (s.value = ((a = (o = i.composedPath) == null ? void 0 : o.call(i)) == null ? void 0 : a[0]) || i.target);
  }, !0), Zn("mousedown", (i) => {
    var o, a;
    n.value && (s.value = ((a = (o = i.composedPath) == null ? void 0 : o.call(i)) == null ? void 0 : a[0]) || i.target);
  }, !0), Zn("click", (i) => {
    $f() || s.value && (r(i, () => s.value), s.value = null);
  }, !0), Zn("touchend", (i) => r(i, () => i.target instanceof HTMLElement ? i.target : null), !0), Aa("blur", (i) => r(i, () => window.document.activeElement instanceof HTMLIFrameElement ? window.document.activeElement : null), !0);
}
function Ki(e, t) {
  if (e) return e;
  let n = t ?? "button";
  if (typeof n == "string" && n.toLowerCase() === "button") return "button";
}
function th(e, t) {
  let n = /* @__PURE__ */ L(Ki(e.value.type, e.value.as));
  return sn(() => {
    n.value = Ki(e.value.type, e.value.as);
  }), Qt(() => {
    var r;
    n.value || W(t) && W(t) instanceof HTMLButtonElement && !((r = W(t)) != null && r.hasAttribute("type")) && (n.value = "button");
  }), n;
}
var ms = ((e) => (e[e.None = 0] = "None", e[e.RenderStrategy = 1] = "RenderStrategy", e[e.Static = 2] = "Static", e))(ms || {}), nh = ((e) => (e[e.Unmount = 0] = "Unmount", e[e.Hidden = 1] = "Hidden", e))(nh || {});
function Or({ visible: e = !0, features: t = 0, ourProps: n, theirProps: r, ...s }) {
  var i;
  let o = Va(r, n), a = Object.assign(s, { props: o });
  if (e || t & 2 && o.static) return zr(a);
  if (t & 1) {
    let l = (i = o.unmount) == null || i ? 0 : 1;
    return Ct(l, { 0() {
      return null;
    }, 1() {
      return zr({ ...s, props: { ...o, hidden: !0, style: { display: "none" } } });
    } });
  }
  return zr(a);
}
function zr({ props: e, attrs: t, slots: n, slot: r, name: s }) {
  var i, o;
  let { as: a, ...l } = rh(e, ["unmount", "static"]), c = (i = n.default) == null ? void 0 : i.call(n, r), u = {};
  if (r) {
    let h = !1, m = [];
    for (let [g, w] of Object.entries(r)) typeof w == "boolean" && (h = !0), w === !0 && m.push(g);
    h && (u["data-headlessui-state"] = m.join(" "));
  }
  if (a === "template") {
    if (c = xa(c ?? []), Object.keys(l).length > 0 || Object.keys(t).length > 0) {
      let [h, ...m] = c ?? [];
      if (!sh(h) || m.length > 0) throw new Error(['Passing props on "template"!', "", `The current component <${s} /> is rendering a "template".`, "However we need to passthrough the following props:", Object.keys(l).concat(Object.keys(t)).map((p) => p.trim()).filter((p, R, F) => F.indexOf(p) === R).sort((p, R) => p.localeCompare(R)).map((p) => `  - ${p}`).join(`
`), "", "You can apply a few solutions:", ['Add an `as="..."` prop, to ensure that we render an actual element instead of a "template".', "Render a single element as the child so that we can forward the props onto that element."].map((p) => `  - ${p}`).join(`
`)].join(`
`));
      let g = Va((o = h.props) != null ? o : {}, l, u), w = qt(h, g, !0);
      for (let p in g) p.startsWith("on") && (w.props || (w.props = {}), w.props[p] = g[p]);
      return w;
    }
    return Array.isArray(c) && c.length === 1 ? c[0] : c;
  }
  return ct(a, Object.assign({}, l, u), { default: () => c });
}
function xa(e) {
  return e.flatMap((t) => t.type === ge ? xa(t.children) : [t]);
}
function Va(...e) {
  if (e.length === 0) return {};
  if (e.length === 1) return e[0];
  let t = {}, n = {};
  for (let r of e) for (let s in r) s.startsWith("on") && typeof r[s] == "function" ? (n[s] != null || (n[s] = []), n[s].push(r[s])) : t[s] = r[s];
  if (t.disabled || t["aria-disabled"]) return Object.assign(t, Object.fromEntries(Object.keys(n).map((r) => [r, void 0])));
  for (let r in n) Object.assign(t, { [r](s, ...i) {
    let o = n[r];
    for (let a of o) {
      if (s instanceof Event && s.defaultPrevented) return;
      a(s, ...i);
    }
  } });
  return t;
}
function rh(e, t = []) {
  let n = Object.assign({}, e);
  for (let r of t) r in n && delete n[r];
  return n;
}
function sh(e) {
  return e == null ? !1 : typeof e.type == "string" || typeof e.type == "object" || typeof e.type == "function";
}
var Fn = ((e) => (e[e.None = 1] = "None", e[e.Focusable = 2] = "Focusable", e[e.Hidden = 4] = "Hidden", e))(Fn || {});
let gr = /* @__PURE__ */ ke({ name: "Hidden", props: { as: { type: [Object, String], default: "div" }, features: { type: Number, default: 1 } }, setup(e, { slots: t, attrs: n }) {
  return () => {
    var r;
    let { features: s, ...i } = e, o = { "aria-hidden": (s & 2) === 2 ? !0 : (r = i["aria-hidden"]) != null ? r : void 0, hidden: (s & 4) === 4 ? !0 : void 0, style: { position: "fixed", top: 1, left: 1, width: 1, height: 0, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", borderWidth: "0", ...(s & 4) === 4 && (s & 2) !== 2 && { display: "none" } } };
    return Or({ ourProps: o, theirProps: i, slot: {}, attrs: n, slots: t, name: "Hidden" });
  };
} }), Ca = /* @__PURE__ */ Symbol("Context");
var Qn = ((e) => (e[e.Open = 1] = "Open", e[e.Closed = 2] = "Closed", e[e.Closing = 4] = "Closing", e[e.Opening = 8] = "Opening", e))(Qn || {});
function ih() {
  return Ft(Ca, null);
}
function oh(e) {
  Br(Ca, e);
}
var Et = ((e) => (e.Space = " ", e.Enter = "Enter", e.Escape = "Escape", e.Backspace = "Backspace", e.Delete = "Delete", e.ArrowLeft = "ArrowLeft", e.ArrowUp = "ArrowUp", e.ArrowRight = "ArrowRight", e.ArrowDown = "ArrowDown", e.Home = "Home", e.End = "End", e.PageUp = "PageUp", e.PageDown = "PageDown", e.Tab = "Tab", e))(Et || {});
function ah(e, t, n, r) {
  Dr.isServer || Qt((s) => {
    e = e ?? window, e.addEventListener(t, n, r), s(() => e.removeEventListener(t, n, r));
  });
}
var At = ((e) => (e[e.Forwards = 0] = "Forwards", e[e.Backwards = 1] = "Backwards", e))(At || {});
function Sa() {
  let e = /* @__PURE__ */ L(0);
  return Aa("keydown", (t) => {
    t.key === "Tab" && (e.value = t.shiftKey ? 1 : 0);
  }), e;
}
function lh({ defaultContainers: e = [], portals: t, mainTreeNodeRef: n } = {}) {
  let r = /* @__PURE__ */ L(null), s = Pn(r);
  function i() {
    var o, a, l;
    let c = [];
    for (let u of e) u !== null && (u instanceof HTMLElement ? c.push(u) : "value" in u && u.value instanceof HTMLElement && c.push(u.value));
    if (t != null && t.value) for (let u of t.value) c.push(u);
    for (let u of (o = s?.querySelectorAll("html > *, body > *")) != null ? o : []) u !== document.body && u !== document.head && u instanceof HTMLElement && u.id !== "headlessui-portal-root" && (u.contains(W(r)) || u.contains((l = (a = W(r)) == null ? void 0 : a.getRootNode()) == null ? void 0 : l.host) || c.some((h) => u.contains(h)) || c.push(u));
    return c;
  }
  return { resolveContainers: i, contains(o) {
    return i().some((a) => a.contains(o));
  }, mainTreeNodeRef: r, MainTreeNode() {
    return n != null ? null : ct(gr, { features: Fn.Hidden, ref: r });
  } };
}
let Ni = /* @__PURE__ */ Symbol("PortalParentContext");
function ch() {
  let e = Ft(Ni, null), t = /* @__PURE__ */ L([]);
  function n(i) {
    return t.value.push(i), e && e.register(i), () => r(i);
  }
  function r(i) {
    let o = t.value.indexOf(i);
    o !== -1 && t.value.splice(o, 1), e && e.unregister(i);
  }
  let s = { register: n, unregister: r, portals: t };
  return [t, /* @__PURE__ */ ke({ name: "PortalWrapper", setup(i, { slots: o }) {
    return Br(Ni, s), () => {
      var a;
      return (a = o.default) == null ? void 0 : a.call(o);
    };
  } })];
}
var uh = ((e) => (e[e.Open = 0] = "Open", e[e.Closed = 1] = "Closed", e))(uh || {});
let Ea = /* @__PURE__ */ Symbol("PopoverContext");
function Ns(e) {
  let t = Ft(Ea, null);
  if (t === null) {
    let n = new Error(`<${e} /> is missing a parent <${Ba.name} /> component.`);
    throw Error.captureStackTrace && Error.captureStackTrace(n, Ns), n;
  }
  return t;
}
let fh = /* @__PURE__ */ Symbol("PopoverGroupContext");
function Ia() {
  return Ft(fh, null);
}
let Ma = /* @__PURE__ */ Symbol("PopoverPanelContext");
function hh() {
  return Ft(Ma, null);
}
let Ba = /* @__PURE__ */ ke({ name: "Popover", inheritAttrs: !1, props: { as: { type: [Object, String], default: "div" } }, setup(e, { slots: t, attrs: n, expose: r }) {
  var s;
  let i = /* @__PURE__ */ L(null);
  r({ el: i, $el: i });
  let o = /* @__PURE__ */ L(1), a = /* @__PURE__ */ L(null), l = /* @__PURE__ */ L(null), c = /* @__PURE__ */ L(null), u = /* @__PURE__ */ L(null), h = j(() => Pn(i)), m = j(() => {
    var b, C;
    if (!W(a) || !W(u)) return !1;
    for (let me of document.querySelectorAll("body > *")) if (Number(me?.contains(W(a))) ^ Number(me?.contains(W(u)))) return !0;
    let M = Ur(), T = M.indexOf(W(a)), $ = (T + M.length - 1) % M.length, _ = (T + 1) % M.length, pe = M[$], De = M[_];
    return !((b = W(u)) != null && b.contains(pe)) && !((C = W(u)) != null && C.contains(De));
  }), g = { popoverState: o, buttonId: /* @__PURE__ */ L(null), panelId: /* @__PURE__ */ L(null), panel: u, button: a, isPortalled: m, beforePanelSentinel: l, afterPanelSentinel: c, togglePopover() {
    o.value = Ct(o.value, { 0: 1, 1: 0 });
  }, closePopover() {
    o.value !== 1 && (o.value = 1);
  }, close(b) {
    g.closePopover();
    let C = b ? b instanceof HTMLElement ? b : b.value instanceof HTMLElement ? W(b) : W(g.button) : W(g.button);
    C?.focus();
  } };
  Br(Ea, g), oh(j(() => Ct(o.value, { 0: Qn.Open, 1: Qn.Closed })));
  let w = { buttonId: g.buttonId, panelId: g.panelId, close() {
    g.closePopover();
  } }, p = Ia(), R = p?.registerPopover, [F, I] = ch(), O = lh({ mainTreeNodeRef: p?.mainTreeNodeRef, portals: F, defaultContainers: [a, u] });
  function E() {
    var b, C, M, T;
    return (T = p?.isFocusWithinPopoverGroup()) != null ? T : ((b = h.value) == null ? void 0 : b.activeElement) && (((C = W(a)) == null ? void 0 : C.contains(h.value.activeElement)) || ((M = W(u)) == null ? void 0 : M.contains(h.value.activeElement)));
  }
  return Qt(() => R?.(w)), ah((s = h.value) == null ? void 0 : s.defaultView, "focus", (b) => {
    var C, M;
    b.target !== window && b.target instanceof HTMLElement && o.value === 0 && (E() || a && u && (O.contains(b.target) || (C = W(g.beforePanelSentinel)) != null && C.contains(b.target) || (M = W(g.afterPanelSentinel)) != null && M.contains(b.target) || g.closePopover()));
  }, !0), eh(O.resolveContainers, (b, C) => {
    var M;
    g.closePopover(), ba(C, Ks.Loose) || (b.preventDefault(), (M = W(a)) == null || M.focus());
  }, j(() => o.value === 0)), () => {
    let b = { open: o.value === 0, close: g.close };
    return ct(ge, [ct(I, {}, () => Or({ theirProps: { ...e, ...n }, ourProps: { ref: i }, slot: b, slots: t, attrs: n, name: "Popover" })), ct(O.MainTreeNode)]);
  };
} }), dh = /* @__PURE__ */ ke({ name: "PopoverButton", props: { as: { type: [Object, String], default: "button" }, disabled: { type: [Boolean], default: !1 }, id: { type: String, default: null } }, inheritAttrs: !1, setup(e, { attrs: t, slots: n, expose: r }) {
  var s;
  let i = (s = e.id) != null ? s : `headlessui-popover-button-${xn()}`, o = Ns("PopoverButton"), a = j(() => Pn(o.button));
  r({ el: o.button, $el: o.button }), sn(() => {
    o.buttonId.value = i;
  }), Yn(() => {
    o.buttonId.value = null;
  });
  let l = Ia(), c = l?.closeOthers, u = hh(), h = j(() => u === null ? !1 : u.value === o.panelId.value), m = /* @__PURE__ */ L(null), g = `headlessui-focus-sentinel-${xn()}`;
  h.value || Qt(() => {
    o.button.value = W(m);
  });
  let w = th(j(() => ({ as: e.as, type: t.type })), m);
  function p(b) {
    var C, M, T, $, _;
    if (h.value) {
      if (o.popoverState.value === 1) return;
      switch (b.key) {
        case Et.Space:
        case Et.Enter:
          b.preventDefault(), (M = (C = b.target).click) == null || M.call(C), o.closePopover(), (T = W(o.button)) == null || T.focus();
          break;
      }
    } else switch (b.key) {
      case Et.Space:
      case Et.Enter:
        b.preventDefault(), b.stopPropagation(), o.popoverState.value === 1 && c?.(o.buttonId.value), o.togglePopover();
        break;
      case Et.Escape:
        if (o.popoverState.value !== 0) return c?.(o.buttonId.value);
        if (!W(o.button) || ($ = a.value) != null && $.activeElement && !((_ = W(o.button)) != null && _.contains(a.value.activeElement))) return;
        b.preventDefault(), b.stopPropagation(), o.closePopover();
        break;
    }
  }
  function R(b) {
    h.value || b.key === Et.Space && b.preventDefault();
  }
  function F(b) {
    var C, M;
    e.disabled || (h.value ? (o.closePopover(), (C = W(o.button)) == null || C.focus()) : (b.preventDefault(), b.stopPropagation(), o.popoverState.value === 1 && c?.(o.buttonId.value), o.togglePopover(), (M = W(o.button)) == null || M.focus()));
  }
  function I(b) {
    b.preventDefault(), b.stopPropagation();
  }
  let O = Sa();
  function E() {
    let b = W(o.panel);
    if (!b) return;
    function C() {
      Ct(O.value, { [At.Forwards]: () => Yt(b, bt.First), [At.Backwards]: () => Yt(b, bt.Last) }) === pr.Error && Yt(Ur().filter((M) => M.dataset.headlessuiFocusGuard !== "true"), Ct(O.value, { [At.Forwards]: bt.Next, [At.Backwards]: bt.Previous }), { relativeTo: W(o.button) });
    }
    C();
  }
  return () => {
    let b = o.popoverState.value === 0, C = { open: b }, { ...M } = e, T = h.value ? { ref: m, type: w.value, onKeydown: p, onClick: F } : { ref: m, id: i, type: w.value, "aria-expanded": o.popoverState.value === 0, "aria-controls": W(o.panel) ? o.panelId.value : void 0, disabled: e.disabled ? !0 : void 0, onKeydown: p, onKeyup: R, onClick: F, onMousedown: I };
    return ct(ge, [Or({ ourProps: T, theirProps: { ...t, ...M }, slot: C, attrs: t, slots: n, name: "PopoverButton" }), b && !h.value && o.isPortalled.value && ct(gr, { id: g, features: Fn.Focusable, "data-headlessui-focus-guard": !0, as: "button", type: "button", onFocus: E })]);
  };
} }), ph = /* @__PURE__ */ ke({ name: "PopoverPanel", props: { as: { type: [Object, String], default: "div" }, static: { type: Boolean, default: !1 }, unmount: { type: Boolean, default: !0 }, focus: { type: Boolean, default: !1 }, id: { type: String, default: null } }, inheritAttrs: !1, setup(e, { attrs: t, slots: n, expose: r }) {
  var s;
  let i = (s = e.id) != null ? s : `headlessui-popover-panel-${xn()}`, { focus: o } = e, a = Ns("PopoverPanel"), l = j(() => Pn(a.panel)), c = `headlessui-focus-sentinel-before-${xn()}`, u = `headlessui-focus-sentinel-after-${xn()}`;
  r({ el: a.panel, $el: a.panel }), sn(() => {
    a.panelId.value = i;
  }), Yn(() => {
    a.panelId.value = null;
  }), Br(Ma, a.panelId), Qt(() => {
    var I, O;
    if (!o || a.popoverState.value !== 0 || !a.panel) return;
    let E = (I = l.value) == null ? void 0 : I.activeElement;
    (O = W(a.panel)) != null && O.contains(E) || Yt(W(a.panel), bt.First);
  });
  let h = ih(), m = j(() => h !== null ? (h.value & Qn.Open) === Qn.Open : a.popoverState.value === 0);
  function g(I) {
    var O, E;
    switch (I.key) {
      case Et.Escape:
        if (a.popoverState.value !== 0 || !W(a.panel) || l.value && !((O = W(a.panel)) != null && O.contains(l.value.activeElement))) return;
        I.preventDefault(), I.stopPropagation(), a.closePopover(), (E = W(a.button)) == null || E.focus();
        break;
    }
  }
  function w(I) {
    var O, E, b, C, M;
    let T = I.relatedTarget;
    T && W(a.panel) && ((O = W(a.panel)) != null && O.contains(T) || (a.closePopover(), ((b = (E = W(a.beforePanelSentinel)) == null ? void 0 : E.contains) != null && b.call(E, T) || (M = (C = W(a.afterPanelSentinel)) == null ? void 0 : C.contains) != null && M.call(C, T)) && T.focus({ preventScroll: !0 })));
  }
  let p = Sa();
  function R() {
    let I = W(a.panel);
    if (!I) return;
    function O() {
      Ct(p.value, { [At.Forwards]: () => {
        var E;
        Yt(I, bt.First) === pr.Error && ((E = W(a.afterPanelSentinel)) == null || E.focus());
      }, [At.Backwards]: () => {
        var E;
        (E = W(a.button)) == null || E.focus({ preventScroll: !0 });
      } });
    }
    O();
  }
  function F() {
    let I = W(a.panel);
    if (!I) return;
    function O() {
      Ct(p.value, { [At.Forwards]: () => {
        let E = W(a.button), b = W(a.panel);
        if (!E) return;
        let C = Ur(), M = C.indexOf(E), T = C.slice(0, M + 1), $ = [...C.slice(M + 1), ...T];
        for (let _ of $.slice()) if (_.dataset.headlessuiFocusGuard === "true" || b != null && b.contains(_)) {
          let pe = $.indexOf(_);
          pe !== -1 && $.splice(pe, 1);
        }
        Yt($, bt.First, { sorted: !1 });
      }, [At.Backwards]: () => {
        var E;
        Yt(I, bt.Previous) === pr.Error && ((E = W(a.button)) == null || E.focus());
      } });
    }
    O();
  }
  return () => {
    let I = { open: a.popoverState.value === 0, close: a.close }, { focus: O, ...E } = e, b = { ref: a.panel, id: i, onKeydown: g, onFocusout: o && a.popoverState.value === 0 ? w : void 0, tabIndex: -1 };
    return Or({ ourProps: b, theirProps: { ...t, ...E }, attrs: t, slot: I, slots: { ...n, default: (...C) => {
      var M;
      return [ct(ge, [m.value && a.isPortalled.value && ct(gr, { id: c, ref: a.beforePanelSentinel, features: Fn.Focusable, "data-headlessui-focus-guard": !0, as: "button", type: "button", onFocus: R }), (M = n.default) == null ? void 0 : M.call(n, ...C), m.value && a.isPortalled.value && ct(gr, { id: u, ref: a.afterPanelSentinel, features: Fn.Focusable, "data-headlessui-focus-guard": !0, as: "button", type: "button", onFocus: F })])];
    } }, features: ms.RenderStrategy | ms.Static, visible: m.value, name: "PopoverPanel" });
  };
} });
const gh = { class: "flex-shrink-0" }, mh = ["onClick"], vh = /* @__PURE__ */ ke({
  __name: "SmileBtn",
  emits: ["emojiSelect"],
  setup(e, { emit: t }) {
    const n = t, r = [
      "😂",
      "🤣",
      "😍",
      "🥰",
      "😘",
      "😎",
      "😊",
      "😁",
      "😀",
      "😉",
      "😅",
      "🙃",
      "🥲",
      "🤔",
      "🥳",
      "🤩",
      "😏",
      "🥺",
      "😢",
      "😭",
      "😤",
      "😡",
      "🤬",
      "🤯",
      "😱",
      "🤗",
      "🙏",
      "👍",
      "👎",
      "👏",
      "🙌",
      "🤝",
      "👌",
      "🤌",
      "✌️",
      "🤞",
      "🤟",
      "🤘",
      "👊",
      "✊",
      "💪",
      "🫶",
      "❤️",
      "🧡",
      "💛",
      "💚",
      "💙",
      "💜",
      "🤎",
      "🖤",
      "🤍",
      "💔",
      "💕",
      "💞",
      "💓",
      "💗",
      "💖",
      "💘",
      "💝",
      "💯",
      "💥",
      "🔥",
      "🌟",
      "✨",
      "🎉",
      "🎊",
      "🥳",
      "🎂",
      "🍰",
      "🍕",
      "🍔",
      "🍟",
      "🍣",
      "🍫",
      "🍭",
      "🍩",
      "🍪",
      "🍷",
      "🍺",
      "🍻",
      "🥂",
      "🍹",
      "☕",
      "🍼",
      "🥤",
      "🚗",
      "✈️",
      "🚀",
      "🏠",
      "🏖",
      "🗽",
      "🌍",
      "🌎",
      "🌏",
      "🌈",
      "⛅",
      "☀️",
      "🌙",
      "⭐",
      "🌌",
      "⛄",
      "❄️",
      "☔",
      "🌊",
      "🌋",
      "🐶",
      "🐱",
      "🐭",
      "🐹",
      "🐰",
      "🐻",
      "🐼",
      "🐨",
      "🐯",
      "🦁",
      "🐷",
      "🐸",
      "🐵",
      "🙈",
      "🙉",
      "🙊",
      "🐒",
      "🐔",
      "🐧",
      "🦉",
      "🦋",
      "🐞",
      "🐝",
      "🐠",
      "🐳",
      "🦈",
      "🐙",
      "🌸",
      "🌹",
      "🌺",
      "🌻",
      "🌷",
      "🌼",
      "🪴",
      "🍀",
      "🎄",
      "🌵",
      "🎁",
      "🛍",
      "💄",
      "👠",
      "👑",
      "👜",
      "👗",
      "🕶",
      "⌚",
      "📱",
      "💻",
      "🖤",
      "🤖",
      "👻",
      "💀",
      "☠️",
      "💩",
      "👽",
      "👾",
      "🎃"
    ], s = (i, o) => {
      n("emojiSelect", i), o();
    };
    return (i, o) => (D(), yt(ee(Ba), { class: "relative" }, {
      default: Xn(({ open: a, close: l }) => [
        J(ee(dh), {
          class: be(["w-[36px] h-[36px] rounded-full backdrop-blur-[25px] focus:outline-none focus:ring-0 focus:border-none focus:shadow-none focus-visible:outline-none flex items-center justify-center", [a ? " text-white" : "text-[#64748b]"]]),
          style: Ke({
            background: a ? "rgba(250, 250, 250, 0.08)" : "transparent"
          })
        }, {
          default: Xn(() => [
            y("button", gh, [
              J(ee(Pf), { class: "w-6 h-6 cursor-pointer hover:text-neutral-50 transition-colors" })
            ])
          ]),
          _: 1
        }, 8, ["class", "style"]),
        J(ee(ph), { class: "fixed bottom-[150px] right-[120px] w-[202px] h-[108px] z-50 p-0!" }, {
          default: Xn(() => [
            y("div", {
              class: "p-[12px] pr-[4px] flex flex-wrap w-[225px] h-[108px] overflow-y-auto z-10 backdrop-blur-[25px] rounded-[20px]",
              style: Ke([{ background: "rgba(108, 111, 172, 0.08)" }, {
                "scrollbar-width": "thin",
                "scrollbar-color": "rgba(255, 255, 255, 0.2) transparent"
              }])
            }, [
              (D(), Y(ge, null, It(r, (c) => y("button", {
                key: c,
                type: "button",
                class: "font-normal display-block text-[24px] leading-[28px] flex items-center justify-center cursor-pointer whitespace-nowrap hover:bg-controlsHover",
                onClick: (u) => s(c, l)
              }, Se(c), 9, mh)), 64))
            ])
          ]),
          _: 2
        }, 1024)
      ]),
      _: 1
    }));
  }
}), yh = {
  xmlns: "http://www.w3.org/2000/svg",
  width: "2",
  height: "24",
  fill: "none"
};
function wh(e, t) {
  return D(), Y("svg", yh, [...t[0] || (t[0] = [
    y("rect", {
      width: "2",
      height: "24",
      fill: "#FAFAFA",
      opacity: ".5",
      rx: "1"
    }, null, -1)
  ])]);
}
const bh = { render: wh }, Ah = {
  xmlns: "http://www.w3.org/2000/svg",
  width: "10",
  height: "10",
  fill: "none"
};
function xh(e, t) {
  return D(), Y("svg", Ah, [...t[0] || (t[0] = [
    y("path", {
      fill: "#FAFAFA",
      "fill-rule": "evenodd",
      d: "M.646.646a.5.5 0 0 1 .708 0L5 4.293 8.646.646a.5.5 0 1 1 .708.708L5.707 5l3.647 3.646a.5.5 0 1 1-.708.708L5 5.707 1.354 9.354a.5.5 0 1 1-.708-.708L4.293 5 .646 1.354a.5.5 0 0 1 0-.708",
      "clip-rule": "evenodd"
    }, null, -1)
  ])]);
}
const Vh = { render: xh }, Ch = {
  key: 0,
  class: "w-full flex justify-center items-center backdrop-blur-[25px] rounded-[20px] mb-[16px] py-[12px]",
  style: { background: "rgba(108, 111, 172, 0.08)" }
}, Sh = { class: "flex flex-col gap-[12px] text-[#64748B] font-golos" }, Eh = { class: "flex gap-[8px]" }, Ih = {
  key: 1,
  class: "w-full flex justify-center items-center backdrop-blur-[25px] rounded-[20px] mb-[16px] py-[12px]",
  style: { background: "rgba(108, 111, 172, 0.08)" }
}, Mh = {
  key: 2,
  class: "p-[12px] flex flex-col gap-[10px] rounded-[20px] mb-[12px]",
  style: { background: "rgba(108, 111, 172, 0.08)" }
}, Bh = { class: "flex gap-[10px]" }, kh = { class: "font-normal text-[12px] leading-[10px] text-neutral-50 opacity-50" }, Rh = { class: "flex gap-[8px]" }, Fh = ["src", "alt"], Qh = ["onClick"], Dh = {
  key: 0,
  class: "font-normal text-[12px] leading-3 text-neutral-50 opacity-50"
}, Uh = { class: "flex gap-[10px] grow w-full min-h-[44px]" }, Oh = {
  class: "rounded-[24px] flex-1 flex flex-col overflow-hidden",
  style: { background: "rgba(108, 111, 172, 0.08)" }
}, Gh = {
  key: 0,
  class: "px-[14px] mt-[10px] flex gap-[6px] items-center w-full"
}, Th = { class: "flex flex-col w-full min-w-0" }, Yh = { class: "font-normal text-[10px] leading-3 text-neutral-50 opacity-50 truncate" }, Ph = { class: "font-normal text-xs text-neutral-50 truncate" }, jh = { class: "flex items-end flex-1" }, Kh = { class: "flex justify-center items-center h-full pl-[10px]" }, Nh = ["disabled"], Lh = ["onKeydown"], Wh = { class: "py-[4px] pr-[4px]" }, qh = { class: "flex items-end" }, Jh = ["disabled"], Zh = /* @__PURE__ */ ke({
  __name: "ChatFooter",
  props: {
    accentColor: {},
    sendMessage: { type: Function },
    canSendMessages: { type: Boolean },
    replyingMessage: {},
    conversationId: {},
    chatState: {},
    isMobile: { type: Boolean }
  },
  emits: ["sendRateConversation"],
  setup(e, { expose: t }) {
    const n = e, r = /* @__PURE__ */ L(""), s = /* @__PURE__ */ L([]), i = /* @__PURE__ */ L(), o = /* @__PURE__ */ L(!1), a = /* @__PURE__ */ L(!1), l = /* @__PURE__ */ L(), c = () => {
      i.value && i.value.click();
    }, u = () => {
      s.value.forEach((b) => {
        URL.revokeObjectURL(b.download_url || "");
      }), s.value = [], a.value = !1;
    }, h = async (b) => {
      const C = b.target;
      if (C.files) {
        const M = Array.from(C.files), T = s.value.length + M.length;
        let $ = M;
        if (T > 6) {
          const _ = 6 - s.value.length;
          $ = M.slice(0, _), a.value = !0;
        } else
          a.value = !1;
        o.value = !0;
        for (const _ of $)
          if (w(_)) {
            const pe = {
              attachment_id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              file_name: _.name,
              size_bytes: _.size,
              content_type: _.type,
              download_url: URL.createObjectURL(_)
            };
            s.value.push(pe), m(_, pe.attachment_id);
          } else
            alert(`Файл ${_.name} не поддерживается. Разрешены только изображения.`);
        C.value = "";
      }
    }, m = async (b, C) => {
      if (!n.conversationId) {
        console.error("No conversationId provided");
        return;
      }
      try {
        const M = await Yi.init(n.conversationId, {
          file_name: b.name,
          content_type: b.type,
          size_bytes: b.size
        });
        await fetch(M.upload_url, {
          method: "PUT",
          headers: { "Content-Type": b.type },
          body: b
        }), await Yi.complete(M.attachment_id, n.conversationId);
        const T = s.value.findIndex(($) => $.attachment_id === C);
        T !== -1 && (s.value[T].attachment_id = M.attachment_id);
      } catch (M) {
        console.error("Failed to upload attachment:", M);
        const T = s.value.findIndex(($) => $.attachment_id === C);
        T !== -1 && (URL.revokeObjectURL(s.value[T].download_url || ""), s.value.splice(T, 1));
      } finally {
        s.value.some(
          (T) => T.attachment_id.startsWith("temp-")
        ) || (o.value = !1);
      }
    }, g = j(() => {
      const b = r.value.trim().length > 0 && n.canSendMessages, C = s.value.length > 0;
      if (C) {
        const M = s.value.some(
          (T) => T.attachment_id.startsWith("temp-")
        );
        return !b && !C || M || o.value || n.chatState !== "active";
      }
      return !b && !C;
    }), w = (b) => [
      "image/png",
      "image/jpg",
      "image/jpeg",
      "image/gif",
      "image/webp",
      "image/bmp",
      "image/svg+xml"
    ].includes(b.type), p = (b) => {
      const C = s.value.findIndex((M) => M.attachment_id === b);
      C !== -1 && (URL.revokeObjectURL(s.value[C].download_url || ""), s.value.splice(C, 1), s.value.length < 6 && (a.value = !1));
    }, R = async () => {
      if (await qe(), l.value) {
        l.value.style.height = "auto";
        const b = l.value.scrollHeight, M = Math.min(b, 120);
        l.value.style.height = M + "px";
      }
    }, F = () => {
      (r.value.trim() || s.value.length > 0) && n.canSendMessages && n.sendMessage && (n.sendMessage(r.value.trim(), n.replyingMessage?.message_id, s.value), r.value = "", s.value.forEach((b) => {
        URL.revokeObjectURL(b.download_url || "");
      }), s.value = [], a.value = !1, R());
    }, I = (b) => {
      if (l.value) {
        const C = l.value.selectionStart, M = l.value.selectionEnd, T = r.value.substring(0, C), $ = r.value.substring(M);
        r.value = T + b + $;
        let _ = r.value;
        r.value = _, qe(() => {
          if (l.value) {
            const pe = C + b.length;
            l.value.setSelectionRange(pe, pe), l.value.focus();
          }
        });
      }
    }, O = () => {
      r.value += `
`, R();
    };
    return t({
      focusInput: () => {
        l.value && l.value.focus();
      }
    }), (b, C) => (D(), Y(ge, null, [
      e.chatState === "over" ? (D(), Y("div", Ch, [
        y("div", Sh, [
          C[3] || (C[3] = y("span", { class: "font-normal text-xs text-center" }, "Мы помогли вам?", -1)),
          y("div", Eh, [
            y("button", {
              style: { background: "rgba(108, 111, 172, 0.08)" },
              class: "w-[44px] h-[44px] backdrop-blur-[25px] rounded-full flex justify-center items-center",
              onClick: C[0] || (C[0] = (M) => b.$emit("sendRateConversation", !1))
            }, [
              J(ee(Ff))
            ]),
            y("button", {
              style: { background: "rgba(108, 111, 172, 0.08)" },
              class: "w-[44px] h-[44px] backdrop-blur-[25px] rounded-full flex justify-center items-center",
              onClick: C[1] || (C[1] = (M) => b.$emit("sendRateConversation", !0))
            }, [
              J(Gf)
            ])
          ])
        ])
      ])) : Ve("", !0),
      e.chatState === "thankYou" ? (D(), Y("div", Ih, [...C[4] || (C[4] = [
        y("span", { class: "font-golos font-normal text-xs text-center text-neutral-50" }, "Спасибо за оценку 💜", -1)
      ])])) : Ve("", !0),
      s.value.length > 0 ? (D(), Y("div", Mh, [
        y("div", Bh, [
          y("span", kh, Se(s.value.length) + " фото", 1),
          y("span", {
            style: Ke({ color: e.accentColor }),
            class: "font-normal text-[12px] leading-[10px] cursor-pointer",
            onClick: u
          }, "Отменить", 4)
        ]),
        y("div", Rh, [
          (D(!0), Y(ge, null, It(s.value, (M) => (D(), Y("div", {
            key: M.attachment_id,
            class: "group relative w-[40px] h-[40px] rounded-[12px] overflow-hidden bg-gray-200 flex justify-center items-center"
          }, [
            y("img", {
              src: M.download_url,
              alt: M.file_name,
              class: "w-full h-full object-cover"
            }, null, 8, Fh),
            y("button", {
              style: { background: "rgba(108, 111, 172, 0.08)" },
              onClick: (T) => p(M.attachment_id),
              class: "absolute top-[8px] left-[8px] backdrop-blur-[25px] w-[23.999998092651367px] h-[23.999998092651367px] rounded-lg flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            }, [
              J(ee(Vh))
            ], 8, Qh)
          ]))), 128))
        ]),
        a.value ? (D(), Y("span", Dh, "Превышен максимум")) : Ve("", !0)
      ])) : Ve("", !0),
      y("div", Uh, [
        y("div", Oh, [
          e.replyingMessage ? (D(), Y("div", Gh, [
            J(ee(bh)),
            y("div", Th, [
              y("span", Yh, Se(e.replyingMessage.sender), 1),
              y("span", Ph, Se(e.replyingMessage.text), 1)
            ])
          ])) : Ve("", !0),
          y("div", jh, [
            y("div", Kh, [
              y("button", {
                disabled: e.chatState !== "active",
                class: be(["mr-[6px] w-[24px] h-[24px] flex-shrink-0 transition-opacity", e.chatState === "active" ? "cursor-pointer" : "cursor-not-allowed opacity-50"]),
                onClick: c
              }, [
                J(ee(Ef), {
                  class: be(["w-6 h-6 text-[#64748b] transition-colors", e.chatState === "active" ? "hover:text-neutral-50" : ""])
                }, null, 8, ["class"])
              ], 10, Nh)
            ]),
            y("input", {
              ref_key: "fileInputRef",
              ref: i,
              type: "file",
              multiple: "",
              accept: "image/*,.png,.jpg,.jpeg,.gif,.webp,.bmp,.svg",
              onChange: h,
              style: { display: "none" }
            }, null, 544),
            Bs(y("textarea", {
              ref_key: "textareaRef",
              ref: l,
              "onUpdate:modelValue": C[2] || (C[2] = (M) => r.value = M),
              placeholder: "Сообщение...",
              rows: "1",
              onInput: R,
              onKeydown: [
                Ii(Bn(F, ["exact", "prevent"]), ["enter"]),
                Ii(Bn(O, ["shift", "exact"]), ["enter"])
              ],
              class: be(["flex-1 py-[10px] bg-transparent border-none outline-none text-neutral-50 placeholder-[#64748b] font-golos resize-none max-h-[120px] min-h-[24px] leading-6 hide-scrollbar", [e.isMobile ? "text-md" : "text-sm"]]),
              style: { "word-wrap": "break-word", "white-space": "pre-wrap", "overflow-wrap": "break-word", "overflow-y": "auto", "scrollbar-width": "none", "-ms-overflow-style": "none" }
            }, null, 42, Lh), [
              [nu, r.value]
            ]),
            y("div", Wh, [
              J(vh, { onEmojiSelect: I })
            ])
          ])
        ]),
        y("div", qh, [
          y("button", {
            onClick: F,
            disabled: g.value,
            class: be(["flex items-center justify-center w-[44px] cursor-pointer h-[44px] rounded-[24px] transition-colors disabled:cursor-not-allowed", [g.value ? "text-[#64748b]" : "text-neutral-50 cursor-not-allowed"]]),
            style: Ke({
              background: g.value ? "rgba(108, 111, 172, 0.08)" : n.accentColor
            })
          }, [
            J(ee(Bf), { class: "w-6 h-6" })
          ], 14, Jh)
        ])
      ])
    ], 64));
  }
}), Hh = {
  xmlns: "http://www.w3.org/2000/svg",
  width: "16",
  height: "16",
  fill: "none"
};
function zh(e, t) {
  return D(), Y("svg", Hh, [...t[0] || (t[0] = [
    y("path", {
      fill: "#FAFAFA",
      d: "M11.423 3.769a.73.73 0 0 1 .06.96l-.06.068-7.272 7.273a.73.73 0 0 1-.96.06l-.069-.06L.213 9.16a.727.727 0 0 1 .96-1.088l.069.06 2.394 2.395 6.759-6.758a.727.727 0 0 1 1.028 0m4.364 0a.73.73 0 0 1 .06.96l-.06.068-7.273 7.273a.727.727 0 0 1-1.089-.96l.06-.069 7.273-7.272a.727.727 0 0 1 1.029 0"
    }, null, -1)
  ])]);
}
const Xh = { render: zh }, _h = {
  xmlns: "http://www.w3.org/2000/svg",
  width: "12",
  height: "10",
  fill: "none"
};
function $h(e, t) {
  return D(), Y("svg", _h, [...t[0] || (t[0] = [
    y("path", {
      fill: "#FAFAFA",
      d: "M11.646.769a.73.73 0 0 1 .06.96l-.06.068L4.373 9.07a.73.73 0 0 1-.96.06l-.069-.06L.435 6.16a.727.727 0 0 1 .96-1.088l.069.06 2.395 2.394L10.617.77a.727.727 0 0 1 1.028 0"
    }, null, -1)
  ])]);
}
const ed = { render: $h }, td = {
  xmlns: "http://www.w3.org/2000/svg",
  width: "28",
  height: "28",
  viewBox: "0 0 28 28",
  fill: "none"
}, nd = {
  id: "paint0_linear_12865_5899",
  x1: "0.35",
  y1: "6.3",
  x2: "18.55",
  y2: "28.35",
  gradientUnits: "userSpaceOnUse"
}, rd = ["stop-color"], sd = ["stop-color"], id = ["stop-color"], od = {
  id: "paint1_linear_12865_5899",
  x1: "4.54326",
  y1: "8.66542",
  x2: "17.1522",
  y2: "23.9417",
  gradientUnits: "userSpaceOnUse"
}, ad = ["stop-color"], ld = ["stop-color"], cd = ["stop-color"], ud = /* @__PURE__ */ ke({
  __name: "SupportAvatar",
  props: {
    logoGradients: { default: () => ["#881AFF", "#5E16D9", "#3B0C8A", "#881AFF", "#5E16D9", "#3B0C8A"] }
  },
  setup(e) {
    return (t, n) => (D(), Y("svg", td, [
      n[0] || (n[0] = y("path", {
        d: "M14 0C11.2311 0 8.52431 0.821086 6.22202 2.35943C3.91973 3.89777 2.12532 6.08427 1.06569 8.64243C0.00606596 11.2006 -0.271181 14.0155 0.269012 16.7313C0.809205 19.447 2.14258 21.9416 4.10051 23.8995C6.05845 25.8574 8.55301 27.1908 11.2687 27.731C13.9845 28.2712 16.7994 27.9939 19.3576 26.9343C21.9157 25.8747 24.1022 24.0803 25.6406 21.778C27.1789 19.4757 28 16.7689 28 14C28 10.287 26.525 6.72601 23.8995 4.1005C21.274 1.475 17.713 0 14 0ZM14 25.0376C11.817 25.0376 9.68297 24.3903 7.86784 23.1774C6.05272 21.9646 4.638 20.2408 3.80259 18.2239C2.96718 16.207 2.7486 13.9878 3.17449 11.8467C3.60038 9.70559 4.65161 7.73887 6.19524 6.19524C7.73888 4.6516 9.70559 3.60037 11.8467 3.17448C13.9878 2.7486 16.2071 2.96718 18.2239 3.80259C20.2408 4.638 21.9646 6.05271 23.1774 7.86784C24.3903 9.68296 25.0376 11.817 25.0376 14C25.0346 16.9264 23.8708 19.7322 21.8015 21.8015C19.7322 23.8708 16.9264 25.0346 14 25.0376Z",
        fill: "url(#paint0_linear_12865_5899)"
      }, null, -1)),
      n[1] || (n[1] = y("path", {
        d: "M14 4.30078C12.0817 4.30078 10.2064 4.86963 8.6114 5.93539C7.01637 7.00115 5.7732 8.51596 5.03909 10.2883C4.30498 12.0606 4.11291 14.0107 4.48715 15.8922C4.8614 17.7737 5.78516 19.5019 7.14162 20.8584C8.49807 22.2148 10.2263 23.1386 12.1078 23.5128C13.9892 23.8871 15.9394 23.695 17.7117 22.9609C19.484 22.2268 20.9988 20.9836 22.0646 19.3886C23.1303 17.7935 23.6992 15.9183 23.6992 14C23.6962 11.4285 22.6734 8.9632 20.8551 7.14489C19.0368 5.32657 16.5715 4.30375 14 4.30078ZM14 21.5544C12.0692 21.5544 10.2175 20.7874 8.85225 19.4221C7.48698 18.0569 6.71999 16.2052 6.71999 14.2744H21.28C21.28 15.2304 21.0917 16.1771 20.7258 17.0603C20.36 17.9436 19.8237 18.7461 19.1477 19.4221C18.4717 20.0981 17.6692 20.6344 16.7859 21.0002C15.9027 21.3661 14.956 21.5544 14 21.5544Z",
        fill: "url(#paint1_linear_12865_5899)"
      }, null, -1)),
      y("defs", null, [
        y("linearGradient", nd, [
          y("stop", {
            "stop-color": e.logoGradients[0]
          }, null, 8, rd),
          y("stop", {
            offset: "0.52399",
            "stop-color": e.logoGradients[1]
          }, null, 8, sd),
          y("stop", {
            offset: "1",
            "stop-color": e.logoGradients[2]
          }, null, 8, id)
        ]),
        y("linearGradient", od, [
          y("stop", {
            "stop-color": e.logoGradients[3]
          }, null, 8, ad),
          y("stop", {
            offset: "0.52399",
            "stop-color": e.logoGradients[4]
          }, null, 8, ld),
          y("stop", {
            offset: "1",
            "stop-color": e.logoGradients[5]
          }, null, 8, cd)
        ])
      ])
    ]));
  }
}), fd = { class: "w-full h-full overflow-hidden bg-transparent" }, hd = ["src", "alt"], dd = {
  key: 1,
  class: "w-full h-full flex flex-col items-center justify-center bg-gray-50 border border-gray-200 p-2 text-center"
}, pd = { class: "flex-1 flex flex-col justify-center min-h-0" }, gd = { class: "text-xs font-medium text-gray-800 mb-0.5 break-words leading-tight" }, md = { class: "text-[10px] text-gray-600" }, Li = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjBGMEYwIi8+CjxwYXRoIGQ9Ik0xMiA4VjE2TTggMTJIMTYiIHN0cm9rZT0iIzk5OTk5OSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+", ze = /* @__PURE__ */ ke({
  __name: "AttachmentImage",
  props: {
    attachment: {}
  },
  setup(e) {
    const t = e, n = j(() => t.attachment.content_type.startsWith("image/")), r = j(() => {
      const o = t.attachment.file_name;
      return o.length > 20 ? o.substring(0, 17) + "..." : o;
    });
    function s(o) {
      const a = o.target;
      a.src = Li;
    }
    function i(o) {
      if (o === 0) return "0 B";
      const a = 1024, l = ["B", "KB", "MB", "GB"], c = Math.floor(Math.log(o) / Math.log(a));
      return parseFloat((o / Math.pow(a, c)).toFixed(1)) + " " + l[c];
    }
    return (o, a) => (D(), Y("div", fd, [
      n.value ? (D(), Y("img", {
        key: 0,
        src: e.attachment.download_url || Li,
        alt: e.attachment.file_name,
        class: "w-full h-full object-cover transition-transform duration-200 hover:scale-105 cursor-pointer",
        onError: s
      }, null, 40, hd)) : (D(), Y("div", dd, [
        a[0] || (a[0] = y("div", { class: "text-2xl mb-1" }, "📎", -1)),
        y("div", pd, [
          y("div", gd, Se(r.value), 1),
          y("div", md, Se(i(e.attachment.size_bytes)), 1)
        ])
      ]))
    ]));
  }
}), vd = {
  key: 0,
  class: "w-full aspect-[3/4] min-w-[183px] min-h-[243px]"
}, yd = {
  key: 1,
  class: "grid grid-cols-2 gap-0.5 w-full min-w-[214px]"
}, wd = {
  key: 2,
  class: "grid grid-cols-2 gap-0.5 w-full min-w-[214px] aspect-[214/208]"
}, bd = {
  key: 3,
  class: "grid grid-cols-2 grid-rows-2 gap-0.5 w-full min-w-[214px] aspect-[214/208]"
}, Ad = {
  key: 4,
  class: "grid grid-cols-2 gap-0.5 w-full min-w-[162px] aspect-[162/240]"
}, xd = {
  key: 5,
  class: "grid grid-cols-2 grid-rows-3 gap-0.5 w-full min-w-[162px] aspect-[162/240]"
}, Vd = {
  key: 1,
  class: "relative aspect-square min-w-[80px] min-h-[80px]"
}, Cd = {
  key: 0,
  class: "absolute inset-0 bg-black/60 text-white flex items-center justify-center font-semibold text-sm"
}, Wi = /* @__PURE__ */ ke({
  __name: "MsgAttachments",
  props: {
    attachments: {},
    hasText: { type: Boolean },
    isSupportMsg: { type: Boolean }
  },
  setup(e) {
    return (t, n) => e.attachments.length > 0 ? (D(), Y("div", {
      key: 0,
      class: be(["overflow-hidden w-full max-w-sm", e.isSupportMsg ? "" : e.hasText ? "rounded-t-[20px]" : "rounded-[20px]"])
    }, [
      e.attachments.length === 1 ? (D(), Y("div", vd, [
        J(ze, {
          attachment: e.attachments[0]
        }, null, 8, ["attachment"])
      ])) : e.attachments.length === 2 ? (D(), Y("div", yd, [
        (D(!0), Y(ge, null, It(e.attachments, (r) => (D(), yt(ze, {
          key: r.attachment_id,
          attachment: r,
          class: "aspect-[106/137] min-w-[106px] min-h-[137px]"
        }, null, 8, ["attachment"]))), 128))
      ])) : e.attachments.length === 3 ? (D(), Y("div", wd, [
        J(ze, {
          attachment: e.attachments[0],
          class: "row-span-2 aspect-[106/208] min-w-[106px] min-h-[208px]"
        }, null, 8, ["attachment"]),
        J(ze, {
          attachment: e.attachments[1],
          class: "aspect-[106/103] min-w-[106px] min-h-[103px]"
        }, null, 8, ["attachment"]),
        J(ze, {
          attachment: e.attachments[2],
          class: "aspect-[106/103] min-w-[106px] min-h-[103px]"
        }, null, 8, ["attachment"])
      ])) : e.attachments.length === 4 ? (D(), Y("div", bd, [
        (D(!0), Y(ge, null, It(e.attachments, (r) => (D(), yt(ze, {
          key: r.attachment_id,
          attachment: r,
          class: "aspect-[106/103] min-w-[106px] min-h-[103px]"
        }, null, 8, ["attachment"]))), 128))
      ])) : e.attachments.length === 5 ? (D(), Y("div", Ad, [
        (D(!0), Y(ge, null, It(e.attachments.slice(0, 2), (r) => (D(), yt(ze, {
          key: r.attachment_id,
          attachment: r,
          class: "aspect-square min-w-[80px] min-h-[80px]"
        }, null, 8, ["attachment"]))), 128)),
        J(ze, {
          attachment: e.attachments[2],
          class: "col-span-2 aspect-[162/80] min-w-[162px] min-h-[80px]"
        }, null, 8, ["attachment"]),
        (D(!0), Y(ge, null, It(e.attachments.slice(3, 5), (r) => (D(), yt(ze, {
          key: r.attachment_id,
          attachment: r,
          class: "aspect-square min-w-[80px] min-h-[80px]"
        }, null, 8, ["attachment"]))), 128))
      ])) : (D(), Y("div", xd, [
        (D(!0), Y(ge, null, It(e.attachments.slice(0, 6), (r, s) => (D(), Y(ge, {
          key: r.attachment_id
        }, [
          s < 5 ? (D(), yt(ze, {
            key: 0,
            attachment: r,
            class: "aspect-square min-w-[80px] min-h-[80px]"
          }, null, 8, ["attachment"])) : (D(), Y("div", Vd, [
            J(ze, { attachment: r }, null, 8, ["attachment"]),
            e.attachments.length > 6 ? (D(), Y("div", Cd, " +" + Se(e.attachments.length - 6), 1)) : Ve("", !0)
          ]))
        ], 64))), 128))
      ]))
    ], 2)) : Ve("", !0);
  }
}), Sd = {
  xmlns: "http://www.w3.org/2000/svg",
  width: "3",
  height: "32",
  fill: "none"
};
function Ed(e, t) {
  return D(), Y("svg", Sd, [...t[0] || (t[0] = [
    y("rect", {
      width: "3",
      height: "32",
      fill: "#FAFAFA",
      rx: "1.5"
    }, null, -1)
  ])]);
}
const Id = { render: Ed }, Md = {
  key: 0,
  class: "relative"
}, Bd = { class: "w-full flex gap-[10px]" }, kd = {
  id: "avatar",
  class: "h-full"
}, Rd = {
  id: "message",
  class: "px-[12px] py-[8px] flex flex-col gap-0.5 rounded-tr-[20px] rounded-br-[20px] rounded-bl-[20px] min-w-[120px]",
  style: { background: "rgba(108, 111, 172, 0.08)" }
}, Fd = {
  key: 0,
  id: "attachment-msg",
  class: "w-full"
}, Qd = {
  id: "msg",
  class: "min-w-0"
}, Dd = { class: "text-neutral-50 font-normal text-xs whitespace-nowrap" }, Ud = {
  key: 2,
  id: "time-only",
  class: "flex justify-end"
}, Od = { class: "bg-black/20 backdrop-blur-sm rounded px-2 py-1" }, Gd = { class: "text-neutral-50 font-normal text-xs" }, Td = {
  key: 1,
  class: "relative"
}, Yd = { class: "flex flex-col max-w-[85%]" }, Pd = { id: "attachment" }, jd = {
  key: 0,
  class: "flex gap-[6px] items-center rounded-[2px]",
  style: { background: "rgba(255, 255, 255, 0.08)" }
}, Kd = { class: "flex flex-col min-w-0" }, Nd = { class: "font-normal text-[10px] leading-3 text-neutral-50 opacity-50 truncate" }, Ld = { class: "font-normal text-xs text-neutral-50 truncate break-words" }, Wd = {
  key: 0,
  class: "min-w-0"
}, qd = { class: "font-normal text-xs whitespace-nowrap" }, Jd = { key: 0 }, Zd = { key: 1 }, Hd = /* @__PURE__ */ ke({
  __name: "ChatMsg",
  props: {
    message_id: {},
    conversation_id: {},
    seq_no: {},
    sender: {},
    source: {},
    content_type: {},
    text: {},
    attachments: {},
    reply_to_message_id: {},
    created_at: {},
    isReceived: { type: Boolean },
    replyingMessage: {},
    msgColor: {},
    logoGradients: {},
    isMenuOpen: { type: Boolean },
    username: {},
    isTyping: { type: Boolean },
    isMobile: { type: Boolean }
  },
  emits: ["openMenu", "closeMenu"],
  setup(e, { emit: t }) {
    const n = e, r = t, s = j(() => n.sender === "support" || n.sender === "system");
    function i(l) {
      r("openMenu", l, n);
    }
    const o = j(() => n.replyingMessage?.sender === "user" ? n.username || "Вы" : "Поддержка"), a = (l) => {
      const c = new Date(l), u = c.getHours().toString().padStart(2, "0"), h = c.getMinutes().toString().padStart(2, "0");
      return `${u}:${h}`;
    };
    return (l, c) => s.value ? (D(), Y("div", Md, [
      y("div", {
        onContextmenu: Bn(i, ["prevent"]),
        class: "inline-block text-left w-full cursor-default"
      }, [
        y("div", Bd, [
          y("div", kd, [
            J(ud, { "logo-gradients": e.logoGradients }, null, 8, ["logo-gradients"])
          ]),
          y("div", Rd, [
            c[0] || (c[0] = y("div", { class: "w-full" }, [
              y("span", { class: "font-normal text-[12px] leading-[20px] font-unbounded text-neutral-50" }, Se("pos5player"))
            ], -1)),
            e.attachments && e.attachments.length > 0 ? (D(), Y("div", Fd, [
              J(Wi, {
                "is-support-msg": s.value,
                "has-text": !!e.text,
                attachments: e.attachments
              }, null, 8, ["is-support-msg", "has-text", "attachments"])
            ])) : Ve("", !0),
            !e.isTyping && e.text ? (D(), Y("div", {
              key: 1,
              id: "message-content",
              class: be(
                e.text && e.text.length > 30 ? "flex flex-col gap-[4px] font-normal text-sm font-golos" : "grid grid-cols-[1fr_auto] gap-[15px] font-normal text-sm font-golos items-end"
              )
            }, [
              y("div", Qd, [
                y("span", {
                  class: be(["text-neutral-50 break-words word-break-break-word whitespace-pre-wrap", [e.isMobile ? "text-[16px]" : "text-sm"]])
                }, Se(e.text), 3)
              ]),
              y("div", {
                id: "time",
                class: be(e.text && e.text.length > 30 ? "flex items-end justify-end" : "flex items-end")
              }, [
                y("span", Dd, Se(a(e.created_at)), 1)
              ], 2)
            ], 2)) : !e.isTyping && !e.text && e.attachments && e.attachments.length > 0 ? (D(), Y("div", Ud, [
              y("div", Od, [
                y("span", Gd, Se(a(e.created_at)), 1)
              ])
            ])) : Ve("", !0)
          ])
        ])
      ], 32)
    ])) : (D(), Y("div", Td, [
      y("div", {
        onContextmenu: Bn(i, ["prevent"]),
        class: "flex justify-end w-full cursor-default"
      }, [
        y("div", Yd, [
          y("div", Pd, [
            e.attachments ? (D(), yt(Wi, {
              key: 0,
              "has-text": !!e.text,
              attachments: e.attachments
            }, null, 8, ["has-text", "attachments"])) : Ve("", !0)
          ]),
          y("div", {
            id: "message_content",
            style: Ke({
              background: e.text ? e.msgColor : "rgba(108, 111, 172, 0.08)"
            }),
            class: be(["flex flex-col gap-[4px] text-neutral-50", [
              e.attachments && e.attachments.length > 0 ? "" : "rounded-tl-[20px]",
              e.text ? "rounded-br-[20px] rounded-bl-[20px] px-3 py-2 min-w-[80px]" : "absolute bottom-[8px] right-[8px] p-[4px] rounded-[8px] backdrop-blur-[20px]"
            ]])
          }, [
            e.replyingMessage ? (D(), Y("div", jd, [
              J(ee(Id), { class: "text-white" }),
              y("div", Kd, [
                y("span", Nd, Se(o.value), 1),
                y("span", Ld, Se(e.replyingMessage.text), 1)
              ])
            ])) : Ve("", !0),
            y("div", {
              class: be(
                e.text && e.text.length > 30 ? "flex flex-col gap-[4px] w-full" : "grid grid-cols-[1fr_auto] gap-[4px] items-end w-full"
              )
            }, [
              e.text?.length ? (D(), Y("div", Wd, [
                y("span", {
                  class: be(["font-normal text-start text-sm break-words word-break-break-word whitespace-pre-wrap", [e.isMobile ? "text-[16px]" : "text-sm"]])
                }, Se(e.text), 3)
              ])) : Ve("", !0),
              y("div", {
                class: be(
                  e.text && e.text.length > 30 ? "flex gap-[4px] items-end justify-end" : "flex gap-[4px] items-end"
                )
              }, [
                y("span", qd, Se(a(e.created_at)), 1),
                e.isReceived ? (D(), Y("span", Jd, [
                  J(ee(Xh))
                ])) : (D(), Y("span", Zd, [
                  J(ee(ed))
                ]))
              ], 2)
            ], 2)
          ], 6)
        ])
      ], 32)
    ]));
  }
}), zd = {
  xmlns: "http://www.w3.org/2000/svg",
  width: "24",
  height: "24",
  fill: "none"
};
function Xd(e, t) {
  return D(), Y("svg", zd, [...t[0] || (t[0] = [
    y("path", {
      stroke: "currentColor",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "stroke-width": "1.5",
      d: "M9 22h6c5 0 7-2 7-7V9c0-5-2-7-7-7H9C4 2 2 4 2 9v6c0 5 2 7 7 7"
    }, null, -1),
    y("path", {
      stroke: "currentColor",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "stroke-miterlimit": "10",
      "stroke-width": "1.5",
      d: "M15 15.38h-4.92C8.38 15.38 7 14 7 12.3s1.38-3.08 3.08-3.08h6.77"
    }, null, -1),
    y("path", {
      stroke: "currentColor",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "stroke-width": "1.5",
      d: "M15.43 10.77 17 9.19l-1.57-1.57"
    }, null, -1)
  ])]);
}
const _d = { render: Xd }, $d = {
  xmlns: "http://www.w3.org/2000/svg",
  width: "24",
  height: "24",
  fill: "none"
};
function ep(e, t) {
  return D(), Y("svg", $d, [...t[0] || (t[0] = [
    y("path", {
      stroke: "currentColor",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "stroke-width": "1.5",
      d: "M16 12.9v4.2c0 3.5-1.4 4.9-4.9 4.9H6.9C3.4 22 2 20.6 2 17.1v-4.2C2 9.4 3.4 8 6.9 8h4.2c3.5 0 4.9 1.4 4.9 4.9"
    }, null, -1),
    y("path", {
      stroke: "currentColor",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "stroke-width": "1.5",
      d: "M22 6.9v4.2c0 3.5-1.4 4.9-4.9 4.9H16v-3.1C16 9.4 14.6 8 11.1 8H8V6.9C8 3.4 9.4 2 12.9 2h4.2C20.6 2 22 3.4 22 6.9"
    }, null, -1)
  ])]);
}
const tp = { render: ep };
var vs = function(e, t) {
  return vs = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(n, r) {
    n.__proto__ = r;
  } || function(n, r) {
    for (var s in r) Object.prototype.hasOwnProperty.call(r, s) && (n[s] = r[s]);
  }, vs(e, t);
};
function ft(e, t) {
  if (typeof t != "function" && t !== null)
    throw new TypeError("Class extends value " + String(t) + " is not a constructor or null");
  vs(e, t);
  function n() {
    this.constructor = e;
  }
  e.prototype = t === null ? Object.create(t) : (n.prototype = t.prototype, new n());
}
var ys = function() {
  return ys = Object.assign || function(t) {
    for (var n, r = 1, s = arguments.length; r < s; r++) {
      n = arguments[r];
      for (var i in n) Object.prototype.hasOwnProperty.call(n, i) && (t[i] = n[i]);
    }
    return t;
  }, ys.apply(this, arguments);
};
function np(e, t, n, r) {
  function s(i) {
    return i instanceof n ? i : new n(function(o) {
      o(i);
    });
  }
  return new (n || (n = Promise))(function(i, o) {
    function a(u) {
      try {
        c(r.next(u));
      } catch (h) {
        o(h);
      }
    }
    function l(u) {
      try {
        c(r.throw(u));
      } catch (h) {
        o(h);
      }
    }
    function c(u) {
      u.done ? i(u.value) : s(u.value).then(a, l);
    }
    c((r = r.apply(e, t || [])).next());
  });
}
function ka(e, t) {
  var n = { label: 0, sent: function() {
    if (i[0] & 1) throw i[1];
    return i[1];
  }, trys: [], ops: [] }, r, s, i, o = Object.create((typeof Iterator == "function" ? Iterator : Object).prototype);
  return o.next = a(0), o.throw = a(1), o.return = a(2), typeof Symbol == "function" && (o[Symbol.iterator] = function() {
    return this;
  }), o;
  function a(c) {
    return function(u) {
      return l([c, u]);
    };
  }
  function l(c) {
    if (r) throw new TypeError("Generator is already executing.");
    for (; o && (o = 0, c[0] && (n = 0)), n; ) try {
      if (r = 1, s && (i = c[0] & 2 ? s.return : c[0] ? s.throw || ((i = s.return) && i.call(s), 0) : s.next) && !(i = i.call(s, c[1])).done) return i;
      switch (s = 0, i && (c = [c[0] & 2, i.value]), c[0]) {
        case 0:
        case 1:
          i = c;
          break;
        case 4:
          return n.label++, { value: c[1], done: !1 };
        case 5:
          n.label++, s = c[1], c = [0];
          continue;
        case 7:
          c = n.ops.pop(), n.trys.pop();
          continue;
        default:
          if (i = n.trys, !(i = i.length > 0 && i[i.length - 1]) && (c[0] === 6 || c[0] === 2)) {
            n = 0;
            continue;
          }
          if (c[0] === 3 && (!i || c[1] > i[0] && c[1] < i[3])) {
            n.label = c[1];
            break;
          }
          if (c[0] === 6 && n.label < i[1]) {
            n.label = i[1], i = c;
            break;
          }
          if (i && n.label < i[2]) {
            n.label = i[2], n.ops.push(c);
            break;
          }
          i[2] && n.ops.pop(), n.trys.pop();
          continue;
      }
      c = t.call(e, n);
    } catch (u) {
      c = [6, u], s = 0;
    } finally {
      r = i = 0;
    }
    if (c[0] & 5) throw c[1];
    return { value: c[0] ? c[1] : void 0, done: !0 };
  }
}
function rn(e) {
  var t = typeof Symbol == "function" && Symbol.iterator, n = t && e[t], r = 0;
  if (n) return n.call(e);
  if (e && typeof e.length == "number") return {
    next: function() {
      return e && r >= e.length && (e = void 0), { value: e && e[r++], done: !e };
    }
  };
  throw new TypeError(t ? "Object is not iterable." : "Symbol.iterator is not defined.");
}
function Dn(e, t) {
  var n = typeof Symbol == "function" && e[Symbol.iterator];
  if (!n) return e;
  var r = n.call(e), s, i = [], o;
  try {
    for (; (t === void 0 || t-- > 0) && !(s = r.next()).done; ) i.push(s.value);
  } catch (a) {
    o = { error: a };
  } finally {
    try {
      s && !s.done && (n = r.return) && n.call(r);
    } finally {
      if (o) throw o.error;
    }
  }
  return i;
}
function Un(e, t, n) {
  if (n || arguments.length === 2) for (var r = 0, s = t.length, i; r < s; r++)
    (i || !(r in t)) && (i || (i = Array.prototype.slice.call(t, 0, r)), i[r] = t[r]);
  return e.concat(i || Array.prototype.slice.call(t));
}
function tn(e) {
  return this instanceof tn ? (this.v = e, this) : new tn(e);
}
function rp(e, t, n) {
  if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
  var r = n.apply(e, t || []), s, i = [];
  return s = Object.create((typeof AsyncIterator == "function" ? AsyncIterator : Object).prototype), a("next"), a("throw"), a("return", o), s[Symbol.asyncIterator] = function() {
    return this;
  }, s;
  function o(g) {
    return function(w) {
      return Promise.resolve(w).then(g, h);
    };
  }
  function a(g, w) {
    r[g] && (s[g] = function(p) {
      return new Promise(function(R, F) {
        i.push([g, p, R, F]) > 1 || l(g, p);
      });
    }, w && (s[g] = w(s[g])));
  }
  function l(g, w) {
    try {
      c(r[g](w));
    } catch (p) {
      m(i[0][3], p);
    }
  }
  function c(g) {
    g.value instanceof tn ? Promise.resolve(g.value.v).then(u, h) : m(i[0][2], g);
  }
  function u(g) {
    l("next", g);
  }
  function h(g) {
    l("throw", g);
  }
  function m(g, w) {
    g(w), i.shift(), i.length && l(i[0][0], i[0][1]);
  }
}
function sp(e) {
  if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
  var t = e[Symbol.asyncIterator], n;
  return t ? t.call(e) : (e = typeof rn == "function" ? rn(e) : e[Symbol.iterator](), n = {}, r("next"), r("throw"), r("return"), n[Symbol.asyncIterator] = function() {
    return this;
  }, n);
  function r(i) {
    n[i] = e[i] && function(o) {
      return new Promise(function(a, l) {
        o = e[i](o), s(a, l, o.done, o.value);
      });
    };
  }
  function s(i, o, a, l) {
    Promise.resolve(l).then(function(c) {
      i({ value: c, done: a });
    }, o);
  }
}
function Ae(e) {
  return typeof e == "function";
}
function Ra(e) {
  var t = function(r) {
    Error.call(r), r.stack = new Error().stack;
  }, n = e(t);
  return n.prototype = Object.create(Error.prototype), n.prototype.constructor = n, n;
}
var Xr = Ra(function(e) {
  return function(n) {
    e(this), this.message = n ? n.length + ` errors occurred during unsubscription:
` + n.map(function(r, s) {
      return s + 1 + ") " + r.toString();
    }).join(`
  `) : "", this.name = "UnsubscriptionError", this.errors = n;
  };
});
function mr(e, t) {
  if (e) {
    var n = e.indexOf(t);
    0 <= n && e.splice(n, 1);
  }
}
var an = (function() {
  function e(t) {
    this.initialTeardown = t, this.closed = !1, this._parentage = null, this._finalizers = null;
  }
  return e.prototype.unsubscribe = function() {
    var t, n, r, s, i;
    if (!this.closed) {
      this.closed = !0;
      var o = this._parentage;
      if (o)
        if (this._parentage = null, Array.isArray(o))
          try {
            for (var a = rn(o), l = a.next(); !l.done; l = a.next()) {
              var c = l.value;
              c.remove(this);
            }
          } catch (p) {
            t = { error: p };
          } finally {
            try {
              l && !l.done && (n = a.return) && n.call(a);
            } finally {
              if (t) throw t.error;
            }
          }
        else
          o.remove(this);
      var u = this.initialTeardown;
      if (Ae(u))
        try {
          u();
        } catch (p) {
          i = p instanceof Xr ? p.errors : [p];
        }
      var h = this._finalizers;
      if (h) {
        this._finalizers = null;
        try {
          for (var m = rn(h), g = m.next(); !g.done; g = m.next()) {
            var w = g.value;
            try {
              qi(w);
            } catch (p) {
              i = i ?? [], p instanceof Xr ? i = Un(Un([], Dn(i)), Dn(p.errors)) : i.push(p);
            }
          }
        } catch (p) {
          r = { error: p };
        } finally {
          try {
            g && !g.done && (s = m.return) && s.call(m);
          } finally {
            if (r) throw r.error;
          }
        }
      }
      if (i)
        throw new Xr(i);
    }
  }, e.prototype.add = function(t) {
    var n;
    if (t && t !== this)
      if (this.closed)
        qi(t);
      else {
        if (t instanceof e) {
          if (t.closed || t._hasParent(this))
            return;
          t._addParent(this);
        }
        (this._finalizers = (n = this._finalizers) !== null && n !== void 0 ? n : []).push(t);
      }
  }, e.prototype._hasParent = function(t) {
    var n = this._parentage;
    return n === t || Array.isArray(n) && n.includes(t);
  }, e.prototype._addParent = function(t) {
    var n = this._parentage;
    this._parentage = Array.isArray(n) ? (n.push(t), n) : n ? [n, t] : t;
  }, e.prototype._removeParent = function(t) {
    var n = this._parentage;
    n === t ? this._parentage = null : Array.isArray(n) && mr(n, t);
  }, e.prototype.remove = function(t) {
    var n = this._finalizers;
    n && mr(n, t), t instanceof e && t._removeParent(this);
  }, e.EMPTY = (function() {
    var t = new e();
    return t.closed = !0, t;
  })(), e;
})(), Fa = an.EMPTY;
function Qa(e) {
  return e instanceof an || e && "closed" in e && Ae(e.remove) && Ae(e.add) && Ae(e.unsubscribe);
}
function qi(e) {
  Ae(e) ? e() : e.unsubscribe();
}
var ip = {
  Promise: void 0
}, op = {
  setTimeout: function(e, t) {
    for (var n = [], r = 2; r < arguments.length; r++)
      n[r - 2] = arguments[r];
    return setTimeout.apply(void 0, Un([e, t], Dn(n)));
  },
  clearTimeout: function(e) {
    return clearTimeout(e);
  },
  delegate: void 0
};
function Da(e) {
  op.setTimeout(function() {
    throw e;
  });
}
function Ji() {
}
function er(e) {
  e();
}
var Gr = (function(e) {
  ft(t, e);
  function t(n) {
    var r = e.call(this) || this;
    return r.isStopped = !1, n ? (r.destination = n, Qa(n) && n.add(r)) : r.destination = cp, r;
  }
  return t.create = function(n, r, s) {
    return new On(n, r, s);
  }, t.prototype.next = function(n) {
    this.isStopped || this._next(n);
  }, t.prototype.error = function(n) {
    this.isStopped || (this.isStopped = !0, this._error(n));
  }, t.prototype.complete = function() {
    this.isStopped || (this.isStopped = !0, this._complete());
  }, t.prototype.unsubscribe = function() {
    this.closed || (this.isStopped = !0, e.prototype.unsubscribe.call(this), this.destination = null);
  }, t.prototype._next = function(n) {
    this.destination.next(n);
  }, t.prototype._error = function(n) {
    try {
      this.destination.error(n);
    } finally {
      this.unsubscribe();
    }
  }, t.prototype._complete = function() {
    try {
      this.destination.complete();
    } finally {
      this.unsubscribe();
    }
  }, t;
})(an), ap = (function() {
  function e(t) {
    this.partialObserver = t;
  }
  return e.prototype.next = function(t) {
    var n = this.partialObserver;
    if (n.next)
      try {
        n.next(t);
      } catch (r) {
        Hn(r);
      }
  }, e.prototype.error = function(t) {
    var n = this.partialObserver;
    if (n.error)
      try {
        n.error(t);
      } catch (r) {
        Hn(r);
      }
    else
      Hn(t);
  }, e.prototype.complete = function() {
    var t = this.partialObserver;
    if (t.complete)
      try {
        t.complete();
      } catch (n) {
        Hn(n);
      }
  }, e;
})(), On = (function(e) {
  ft(t, e);
  function t(n, r, s) {
    var i = e.call(this) || this, o;
    return Ae(n) || !n ? o = {
      next: n ?? void 0,
      error: r ?? void 0,
      complete: s ?? void 0
    } : o = n, i.destination = new ap(o), i;
  }
  return t;
})(Gr);
function Hn(e) {
  Da(e);
}
function lp(e) {
  throw e;
}
var cp = {
  closed: !0,
  next: Ji,
  error: lp,
  complete: Ji
}, Ls = (function() {
  return typeof Symbol == "function" && Symbol.observable || "@@observable";
})();
function Ws(e) {
  return e;
}
function up(e) {
  return e.length === 0 ? Ws : e.length === 1 ? e[0] : function(n) {
    return e.reduce(function(r, s) {
      return s(r);
    }, n);
  };
}
var Qe = (function() {
  function e(t) {
    t && (this._subscribe = t);
  }
  return e.prototype.lift = function(t) {
    var n = new e();
    return n.source = this, n.operator = t, n;
  }, e.prototype.subscribe = function(t, n, r) {
    var s = this, i = hp(t) ? t : new On(t, n, r);
    return er(function() {
      var o = s, a = o.operator, l = o.source;
      i.add(a ? a.call(i, l) : l ? s._subscribe(i) : s._trySubscribe(i));
    }), i;
  }, e.prototype._trySubscribe = function(t) {
    try {
      return this._subscribe(t);
    } catch (n) {
      t.error(n);
    }
  }, e.prototype.forEach = function(t, n) {
    var r = this;
    return n = Zi(n), new n(function(s, i) {
      var o = new On({
        next: function(a) {
          try {
            t(a);
          } catch (l) {
            i(l), o.unsubscribe();
          }
        },
        error: i,
        complete: s
      });
      r.subscribe(o);
    });
  }, e.prototype._subscribe = function(t) {
    var n;
    return (n = this.source) === null || n === void 0 ? void 0 : n.subscribe(t);
  }, e.prototype[Ls] = function() {
    return this;
  }, e.prototype.pipe = function() {
    for (var t = [], n = 0; n < arguments.length; n++)
      t[n] = arguments[n];
    return up(t)(this);
  }, e.prototype.toPromise = function(t) {
    var n = this;
    return t = Zi(t), new t(function(r, s) {
      var i;
      n.subscribe(function(o) {
        return i = o;
      }, function(o) {
        return s(o);
      }, function() {
        return r(i);
      });
    });
  }, e.create = function(t) {
    return new e(t);
  }, e;
})();
function Zi(e) {
  var t;
  return (t = e ?? ip.Promise) !== null && t !== void 0 ? t : Promise;
}
function fp(e) {
  return e && Ae(e.next) && Ae(e.error) && Ae(e.complete);
}
function hp(e) {
  return e && e instanceof Gr || fp(e) && Qa(e);
}
var dp = Ra(function(e) {
  return function() {
    e(this), this.name = "ObjectUnsubscribedError", this.message = "object unsubscribed";
  };
}), xt = (function(e) {
  ft(t, e);
  function t() {
    var n = e.call(this) || this;
    return n.closed = !1, n.currentObservers = null, n.observers = [], n.isStopped = !1, n.hasError = !1, n.thrownError = null, n;
  }
  return t.prototype.lift = function(n) {
    var r = new ws(this, this);
    return r.operator = n, r;
  }, t.prototype._throwIfClosed = function() {
    if (this.closed)
      throw new dp();
  }, t.prototype.next = function(n) {
    var r = this;
    er(function() {
      var s, i;
      if (r._throwIfClosed(), !r.isStopped) {
        r.currentObservers || (r.currentObservers = Array.from(r.observers));
        try {
          for (var o = rn(r.currentObservers), a = o.next(); !a.done; a = o.next()) {
            var l = a.value;
            l.next(n);
          }
        } catch (c) {
          s = { error: c };
        } finally {
          try {
            a && !a.done && (i = o.return) && i.call(o);
          } finally {
            if (s) throw s.error;
          }
        }
      }
    });
  }, t.prototype.error = function(n) {
    var r = this;
    er(function() {
      if (r._throwIfClosed(), !r.isStopped) {
        r.hasError = r.isStopped = !0, r.thrownError = n;
        for (var s = r.observers; s.length; )
          s.shift().error(n);
      }
    });
  }, t.prototype.complete = function() {
    var n = this;
    er(function() {
      if (n._throwIfClosed(), !n.isStopped) {
        n.isStopped = !0;
        for (var r = n.observers; r.length; )
          r.shift().complete();
      }
    });
  }, t.prototype.unsubscribe = function() {
    this.isStopped = this.closed = !0, this.observers = this.currentObservers = null;
  }, Object.defineProperty(t.prototype, "observed", {
    get: function() {
      var n;
      return ((n = this.observers) === null || n === void 0 ? void 0 : n.length) > 0;
    },
    enumerable: !1,
    configurable: !0
  }), t.prototype._trySubscribe = function(n) {
    return this._throwIfClosed(), e.prototype._trySubscribe.call(this, n);
  }, t.prototype._subscribe = function(n) {
    return this._throwIfClosed(), this._checkFinalizedStatuses(n), this._innerSubscribe(n);
  }, t.prototype._innerSubscribe = function(n) {
    var r = this, s = this, i = s.hasError, o = s.isStopped, a = s.observers;
    return i || o ? Fa : (this.currentObservers = null, a.push(n), new an(function() {
      r.currentObservers = null, mr(a, n);
    }));
  }, t.prototype._checkFinalizedStatuses = function(n) {
    var r = this, s = r.hasError, i = r.thrownError, o = r.isStopped;
    s ? n.error(i) : o && n.complete();
  }, t.prototype.asObservable = function() {
    var n = new Qe();
    return n.source = this, n;
  }, t.create = function(n, r) {
    return new ws(n, r);
  }, t;
})(Qe), ws = (function(e) {
  ft(t, e);
  function t(n, r) {
    var s = e.call(this) || this;
    return s.destination = n, s.source = r, s;
  }
  return t.prototype.next = function(n) {
    var r, s;
    (s = (r = this.destination) === null || r === void 0 ? void 0 : r.next) === null || s === void 0 || s.call(r, n);
  }, t.prototype.error = function(n) {
    var r, s;
    (s = (r = this.destination) === null || r === void 0 ? void 0 : r.error) === null || s === void 0 || s.call(r, n);
  }, t.prototype.complete = function() {
    var n, r;
    (r = (n = this.destination) === null || n === void 0 ? void 0 : n.complete) === null || r === void 0 || r.call(n);
  }, t.prototype._subscribe = function(n) {
    var r, s;
    return (s = (r = this.source) === null || r === void 0 ? void 0 : r.subscribe(n)) !== null && s !== void 0 ? s : Fa;
  }, t;
})(xt), qs = {
  now: function() {
    return (qs.delegate || Date).now();
  },
  delegate: void 0
}, tr = (function(e) {
  ft(t, e);
  function t(n, r, s) {
    n === void 0 && (n = 1 / 0), r === void 0 && (r = 1 / 0), s === void 0 && (s = qs);
    var i = e.call(this) || this;
    return i._bufferSize = n, i._windowTime = r, i._timestampProvider = s, i._buffer = [], i._infiniteTimeWindow = !0, i._infiniteTimeWindow = r === 1 / 0, i._bufferSize = Math.max(1, n), i._windowTime = Math.max(1, r), i;
  }
  return t.prototype.next = function(n) {
    var r = this, s = r.isStopped, i = r._buffer, o = r._infiniteTimeWindow, a = r._timestampProvider, l = r._windowTime;
    s || (i.push(n), !o && i.push(a.now() + l)), this._trimBuffer(), e.prototype.next.call(this, n);
  }, t.prototype._subscribe = function(n) {
    this._throwIfClosed(), this._trimBuffer();
    for (var r = this._innerSubscribe(n), s = this, i = s._infiniteTimeWindow, o = s._buffer, a = o.slice(), l = 0; l < a.length && !n.closed; l += i ? 1 : 2)
      n.next(a[l]);
    return this._checkFinalizedStatuses(n), r;
  }, t.prototype._trimBuffer = function() {
    var n = this, r = n._bufferSize, s = n._timestampProvider, i = n._buffer, o = n._infiniteTimeWindow, a = (o ? 1 : 2) * r;
    if (r < 1 / 0 && a < i.length && i.splice(0, i.length - a), !o) {
      for (var l = s.now(), c = 0, u = 1; u < i.length && i[u] <= l; u += 2)
        c = u;
      c && i.splice(0, c + 1);
    }
  }, t;
})(xt), pp = {
  url: "",
  deserializer: function(e) {
    return JSON.parse(e.data);
  },
  serializer: function(e) {
    return JSON.stringify(e);
  }
}, gp = "WebSocketSubject.error must be called with an object with an error code, and an optional reason: { code: number, reason: string }", mp = (function(e) {
  ft(t, e);
  function t(n, r) {
    var s = e.call(this) || this;
    if (s._socket = null, n instanceof Qe)
      s.destination = r, s.source = n;
    else {
      var i = s._config = ys({}, pp);
      if (s._output = new xt(), typeof n == "string")
        i.url = n;
      else
        for (var o in n)
          n.hasOwnProperty(o) && (i[o] = n[o]);
      if (!i.WebSocketCtor && WebSocket)
        i.WebSocketCtor = WebSocket;
      else if (!i.WebSocketCtor)
        throw new Error("no WebSocket constructor can be found");
      s.destination = new tr();
    }
    return s;
  }
  return t.prototype.lift = function(n) {
    var r = new t(this._config, this.destination);
    return r.operator = n, r.source = this, r;
  }, t.prototype._resetState = function() {
    this._socket = null, this.source || (this.destination = new tr()), this._output = new xt();
  }, t.prototype.multiplex = function(n, r, s) {
    var i = this;
    return new Qe(function(o) {
      try {
        i.next(n());
      } catch (l) {
        o.error(l);
      }
      var a = i.subscribe({
        next: function(l) {
          try {
            s(l) && o.next(l);
          } catch (c) {
            o.error(c);
          }
        },
        error: function(l) {
          return o.error(l);
        },
        complete: function() {
          return o.complete();
        }
      });
      return function() {
        try {
          i.next(r());
        } catch (l) {
          o.error(l);
        }
        a.unsubscribe();
      };
    });
  }, t.prototype._connectSocket = function() {
    var n = this, r = this._config, s = r.WebSocketCtor, i = r.protocol, o = r.url, a = r.binaryType, l = this._output, c = null;
    try {
      c = i ? new s(o, i) : new s(o), this._socket = c, a && (this._socket.binaryType = a);
    } catch (h) {
      l.error(h);
      return;
    }
    var u = new an(function() {
      n._socket = null, c && c.readyState === 1 && c.close();
    });
    c.onopen = function(h) {
      var m = n._socket;
      if (!m) {
        c.close(), n._resetState();
        return;
      }
      var g = n._config.openObserver;
      g && g.next(h);
      var w = n.destination;
      n.destination = Gr.create(function(p) {
        if (c.readyState === 1)
          try {
            var R = n._config.serializer;
            c.send(R(p));
          } catch (F) {
            n.destination.error(F);
          }
      }, function(p) {
        var R = n._config.closingObserver;
        R && R.next(void 0), p && p.code ? c.close(p.code, p.reason) : l.error(new TypeError(gp)), n._resetState();
      }, function() {
        var p = n._config.closingObserver;
        p && p.next(void 0), c.close(), n._resetState();
      }), w && w instanceof tr && u.add(w.subscribe(n.destination));
    }, c.onerror = function(h) {
      n._resetState(), l.error(h);
    }, c.onclose = function(h) {
      c === n._socket && n._resetState();
      var m = n._config.closeObserver;
      m && m.next(h), h.wasClean ? l.complete() : l.error(h);
    }, c.onmessage = function(h) {
      try {
        var m = n._config.deserializer;
        l.next(m(h));
      } catch (g) {
        l.error(g);
      }
    };
  }, t.prototype._subscribe = function(n) {
    var r = this, s = this.source;
    return s ? s.subscribe(n) : (this._socket || this._connectSocket(), this._output.subscribe(n), n.add(function() {
      var i = r._socket;
      r._output.observers.length === 0 && (i && (i.readyState === 1 || i.readyState === 0) && i.close(), r._resetState());
    }), n);
  }, t.prototype.unsubscribe = function() {
    var n = this._socket;
    n && (n.readyState === 1 || n.readyState === 0) && n.close(), this._resetState(), e.prototype.unsubscribe.call(this);
  }, t;
})(ws);
function vp(e) {
  return new mp(e);
}
function yp(e) {
  return Ae(e?.lift);
}
function $e(e) {
  return function(t) {
    if (yp(t))
      return t.lift(function(n) {
        try {
          return e(n, this);
        } catch (r) {
          this.error(r);
        }
      });
    throw new TypeError("Unable to lift unknown Observable type");
  };
}
function He(e, t, n, r, s) {
  return new wp(e, t, n, r, s);
}
var wp = (function(e) {
  ft(t, e);
  function t(n, r, s, i, o, a) {
    var l = e.call(this, n) || this;
    return l.onFinalize = o, l.shouldUnsubscribe = a, l._next = r ? function(c) {
      try {
        r(c);
      } catch (u) {
        n.error(u);
      }
    } : e.prototype._next, l._error = i ? function(c) {
      try {
        i(c);
      } catch (u) {
        n.error(u);
      } finally {
        this.unsubscribe();
      }
    } : e.prototype._error, l._complete = s ? function() {
      try {
        s();
      } catch (c) {
        n.error(c);
      } finally {
        this.unsubscribe();
      }
    } : e.prototype._complete, l;
  }
  return t.prototype.unsubscribe = function() {
    var n;
    if (!this.shouldUnsubscribe || this.shouldUnsubscribe()) {
      var r = this.closed;
      e.prototype.unsubscribe.call(this), !r && ((n = this.onFinalize) === null || n === void 0 || n.call(this));
    }
  }, t;
})(Gr), bp = (function(e) {
  ft(t, e);
  function t(n, r) {
    return e.call(this) || this;
  }
  return t.prototype.schedule = function(n, r) {
    return this;
  }, t;
})(an), Hi = {
  setInterval: function(e, t) {
    for (var n = [], r = 2; r < arguments.length; r++)
      n[r - 2] = arguments[r];
    return setInterval.apply(void 0, Un([e, t], Dn(n)));
  },
  clearInterval: function(e) {
    return clearInterval(e);
  },
  delegate: void 0
}, Ap = (function(e) {
  ft(t, e);
  function t(n, r) {
    var s = e.call(this, n, r) || this;
    return s.scheduler = n, s.work = r, s.pending = !1, s;
  }
  return t.prototype.schedule = function(n, r) {
    var s;
    if (r === void 0 && (r = 0), this.closed)
      return this;
    this.state = n;
    var i = this.id, o = this.scheduler;
    return i != null && (this.id = this.recycleAsyncId(o, i, r)), this.pending = !0, this.delay = r, this.id = (s = this.id) !== null && s !== void 0 ? s : this.requestAsyncId(o, this.id, r), this;
  }, t.prototype.requestAsyncId = function(n, r, s) {
    return s === void 0 && (s = 0), Hi.setInterval(n.flush.bind(n, this), s);
  }, t.prototype.recycleAsyncId = function(n, r, s) {
    if (s === void 0 && (s = 0), s != null && this.delay === s && this.pending === !1)
      return r;
    r != null && Hi.clearInterval(r);
  }, t.prototype.execute = function(n, r) {
    if (this.closed)
      return new Error("executing a cancelled action");
    this.pending = !1;
    var s = this._execute(n, r);
    if (s)
      return s;
    this.pending === !1 && this.id != null && (this.id = this.recycleAsyncId(this.scheduler, this.id, null));
  }, t.prototype._execute = function(n, r) {
    var s = !1, i;
    try {
      this.work(n);
    } catch (o) {
      s = !0, i = o || new Error("Scheduled action threw falsy error");
    }
    if (s)
      return this.unsubscribe(), i;
  }, t.prototype.unsubscribe = function() {
    if (!this.closed) {
      var n = this, r = n.id, s = n.scheduler, i = s.actions;
      this.work = this.state = this.scheduler = null, this.pending = !1, mr(i, this), r != null && (this.id = this.recycleAsyncId(s, r, null)), this.delay = null, e.prototype.unsubscribe.call(this);
    }
  }, t;
})(bp), zi = (function() {
  function e(t, n) {
    n === void 0 && (n = e.now), this.schedulerActionCtor = t, this.now = n;
  }
  return e.prototype.schedule = function(t, n, r) {
    return n === void 0 && (n = 0), new this.schedulerActionCtor(this, t).schedule(r, n);
  }, e.now = qs.now, e;
})(), xp = (function(e) {
  ft(t, e);
  function t(n, r) {
    r === void 0 && (r = zi.now);
    var s = e.call(this, n, r) || this;
    return s.actions = [], s._active = !1, s;
  }
  return t.prototype.flush = function(n) {
    var r = this.actions;
    if (this._active) {
      r.push(n);
      return;
    }
    var s;
    this._active = !0;
    do
      if (s = n.execute(n.state, n.delay))
        break;
    while (n = r.shift());
    if (this._active = !1, s) {
      for (; n = r.shift(); )
        n.unsubscribe();
      throw s;
    }
  }, t;
})(zi), Vp = new xp(Ap), Cp = Vp, Js = new Qe(function(e) {
  return e.complete();
});
function Sp(e) {
  return e && Ae(e.schedule);
}
function Ua(e) {
  return e[e.length - 1];
}
function Oa(e) {
  return Sp(Ua(e)) ? e.pop() : void 0;
}
function Ep(e, t) {
  return typeof Ua(e) == "number" ? e.pop() : t;
}
var Ga = (function(e) {
  return e && typeof e.length == "number" && typeof e != "function";
});
function Ta(e) {
  return Ae(e?.then);
}
function Ya(e) {
  return Ae(e[Ls]);
}
function Pa(e) {
  return Symbol.asyncIterator && Ae(e?.[Symbol.asyncIterator]);
}
function ja(e) {
  return new TypeError("You provided " + (e !== null && typeof e == "object" ? "an invalid object" : "'" + e + "'") + " where a stream was expected. You can provide an Observable, Promise, ReadableStream, Array, AsyncIterable, or Iterable.");
}
function Ip() {
  return typeof Symbol != "function" || !Symbol.iterator ? "@@iterator" : Symbol.iterator;
}
var Ka = Ip();
function Na(e) {
  return Ae(e?.[Ka]);
}
function La(e) {
  return rp(this, arguments, function() {
    var n, r, s, i;
    return ka(this, function(o) {
      switch (o.label) {
        case 0:
          n = e.getReader(), o.label = 1;
        case 1:
          o.trys.push([1, , 9, 10]), o.label = 2;
        case 2:
          return [4, tn(n.read())];
        case 3:
          return r = o.sent(), s = r.value, i = r.done, i ? [4, tn(void 0)] : [3, 5];
        case 4:
          return [2, o.sent()];
        case 5:
          return [4, tn(s)];
        case 6:
          return [4, o.sent()];
        case 7:
          return o.sent(), [3, 2];
        case 8:
          return [3, 10];
        case 9:
          return n.releaseLock(), [7];
        case 10:
          return [2];
      }
    });
  });
}
function Wa(e) {
  return Ae(e?.getReader);
}
function et(e) {
  if (e instanceof Qe)
    return e;
  if (e != null) {
    if (Ya(e))
      return Mp(e);
    if (Ga(e))
      return Bp(e);
    if (Ta(e))
      return kp(e);
    if (Pa(e))
      return qa(e);
    if (Na(e))
      return Rp(e);
    if (Wa(e))
      return Fp(e);
  }
  throw ja(e);
}
function Mp(e) {
  return new Qe(function(t) {
    var n = e[Ls]();
    if (Ae(n.subscribe))
      return n.subscribe(t);
    throw new TypeError("Provided object does not correctly implement Symbol.observable");
  });
}
function Bp(e) {
  return new Qe(function(t) {
    for (var n = 0; n < e.length && !t.closed; n++)
      t.next(e[n]);
    t.complete();
  });
}
function kp(e) {
  return new Qe(function(t) {
    e.then(function(n) {
      t.closed || (t.next(n), t.complete());
    }, function(n) {
      return t.error(n);
    }).then(null, Da);
  });
}
function Rp(e) {
  return new Qe(function(t) {
    var n, r;
    try {
      for (var s = rn(e), i = s.next(); !i.done; i = s.next()) {
        var o = i.value;
        if (t.next(o), t.closed)
          return;
      }
    } catch (a) {
      n = { error: a };
    } finally {
      try {
        i && !i.done && (r = s.return) && r.call(s);
      } finally {
        if (n) throw n.error;
      }
    }
    t.complete();
  });
}
function qa(e) {
  return new Qe(function(t) {
    Qp(e, t).catch(function(n) {
      return t.error(n);
    });
  });
}
function Fp(e) {
  return qa(La(e));
}
function Qp(e, t) {
  var n, r, s, i;
  return np(this, void 0, void 0, function() {
    var o, a;
    return ka(this, function(l) {
      switch (l.label) {
        case 0:
          l.trys.push([0, 5, 6, 11]), n = sp(e), l.label = 1;
        case 1:
          return [4, n.next()];
        case 2:
          if (r = l.sent(), !!r.done) return [3, 4];
          if (o = r.value, t.next(o), t.closed)
            return [2];
          l.label = 3;
        case 3:
          return [3, 1];
        case 4:
          return [3, 11];
        case 5:
          return a = l.sent(), s = { error: a }, [3, 11];
        case 6:
          return l.trys.push([6, , 9, 10]), r && !r.done && (i = n.return) ? [4, i.call(n)] : [3, 8];
        case 7:
          l.sent(), l.label = 8;
        case 8:
          return [3, 10];
        case 9:
          if (s) throw s.error;
          return [7];
        case 10:
          return [7];
        case 11:
          return t.complete(), [2];
      }
    });
  });
}
function Wt(e, t, n, r, s) {
  r === void 0 && (r = 0), s === void 0 && (s = !1);
  var i = t.schedule(function() {
    n(), s ? e.add(this.schedule(null, r)) : this.unsubscribe();
  }, r);
  if (e.add(i), !s)
    return i;
}
function Ja(e, t) {
  return t === void 0 && (t = 0), $e(function(n, r) {
    n.subscribe(He(r, function(s) {
      return Wt(r, e, function() {
        return r.next(s);
      }, t);
    }, function() {
      return Wt(r, e, function() {
        return r.complete();
      }, t);
    }, function(s) {
      return Wt(r, e, function() {
        return r.error(s);
      }, t);
    }));
  });
}
function Za(e, t) {
  return t === void 0 && (t = 0), $e(function(n, r) {
    r.add(e.schedule(function() {
      return n.subscribe(r);
    }, t));
  });
}
function Dp(e, t) {
  return et(e).pipe(Za(t), Ja(t));
}
function Up(e, t) {
  return et(e).pipe(Za(t), Ja(t));
}
function Op(e, t) {
  return new Qe(function(n) {
    var r = 0;
    return t.schedule(function() {
      r === e.length ? n.complete() : (n.next(e[r++]), n.closed || this.schedule());
    });
  });
}
function Gp(e, t) {
  return new Qe(function(n) {
    var r;
    return Wt(n, t, function() {
      r = e[Ka](), Wt(n, t, function() {
        var s, i, o;
        try {
          s = r.next(), i = s.value, o = s.done;
        } catch (a) {
          n.error(a);
          return;
        }
        o ? n.complete() : n.next(i);
      }, 0, !0);
    }), function() {
      return Ae(r?.return) && r.return();
    };
  });
}
function Ha(e, t) {
  if (!e)
    throw new Error("Iterable cannot be null");
  return new Qe(function(n) {
    Wt(n, t, function() {
      var r = e[Symbol.asyncIterator]();
      Wt(n, t, function() {
        r.next().then(function(s) {
          s.done ? n.complete() : n.next(s.value);
        });
      }, 0, !0);
    });
  });
}
function Tp(e, t) {
  return Ha(La(e), t);
}
function Yp(e, t) {
  if (e != null) {
    if (Ya(e))
      return Dp(e, t);
    if (Ga(e))
      return Op(e, t);
    if (Ta(e))
      return Up(e, t);
    if (Pa(e))
      return Ha(e, t);
    if (Na(e))
      return Gp(e, t);
    if (Wa(e))
      return Tp(e, t);
  }
  throw ja(e);
}
function za(e, t) {
  return t ? Yp(e, t) : et(e);
}
function Pp() {
  for (var e = [], t = 0; t < arguments.length; t++)
    e[t] = arguments[t];
  var n = Oa(e);
  return za(e, n);
}
function jp(e) {
  return e instanceof Date && !isNaN(e);
}
function Xa(e, t) {
  return $e(function(n, r) {
    var s = 0;
    n.subscribe(He(r, function(i) {
      r.next(e.call(t, i, s++));
    }));
  });
}
function Kp(e, t, n, r, s, i, o, a) {
  var l = [], c = 0, u = 0, h = !1, m = function() {
    h && !l.length && !c && t.complete();
  }, g = function(p) {
    return c < r ? w(p) : l.push(p);
  }, w = function(p) {
    c++;
    var R = !1;
    et(n(p, u++)).subscribe(He(t, function(F) {
      t.next(F);
    }, function() {
      R = !0;
    }, void 0, function() {
      if (R)
        try {
          c--;
          for (var F = function() {
            var I = l.shift();
            o || w(I);
          }; l.length && c < r; )
            F();
          m();
        } catch (I) {
          t.error(I);
        }
    }));
  };
  return e.subscribe(He(t, g, function() {
    h = !0, m();
  })), function() {
  };
}
function Zs(e, t, n) {
  return n === void 0 && (n = 1 / 0), Ae(t) ? Zs(function(r, s) {
    return Xa(function(i, o) {
      return t(r, i, s, o);
    })(et(e(r, s)));
  }, n) : (typeof t == "number" && (n = t), $e(function(r, s) {
    return Kp(r, s, e, n);
  }));
}
function Np(e) {
  return e === void 0 && (e = 1 / 0), Zs(Ws, e);
}
function Lp(e, t, n) {
  return e === void 0 && (e = 0), n === void 0 && (n = Cp), new Qe(function(r) {
    var s = jp(e) ? +e - n.now() : e;
    s < 0 && (s = 0);
    var i = 0;
    return n.schedule(function() {
      r.closed || (r.next(i++), r.complete());
    }, s);
  });
}
function Wp() {
  for (var e = [], t = 0; t < arguments.length; t++)
    e[t] = arguments[t];
  var n = Oa(e), r = Ep(e, 1 / 0), s = e;
  return s.length ? s.length === 1 ? et(s[0]) : Np(r)(za(s, n)) : Js;
}
function Ht(e, t) {
  return $e(function(n, r) {
    var s = 0;
    n.subscribe(He(r, function(i) {
      return e.call(t, i, s++) && r.next(i);
    }));
  });
}
function qp(e, t, n, r, s) {
  return function(i, o) {
    var a = n, l = t, c = 0;
    i.subscribe(He(o, function(u) {
      var h = c++;
      l = a ? e(l, u, h) : (a = !0, u), o.next(l);
    }, s));
  };
}
function Jp(e) {
  return e <= 0 ? function() {
    return Js;
  } : $e(function(t, n) {
    var r = 0;
    t.subscribe(He(n, function(s) {
      ++r <= e && (n.next(s), e <= r && n.complete());
    }));
  });
}
function Zp(e) {
  return Xa(function() {
    return e;
  });
}
function Hp(e, t) {
  return Zs(function(n, r) {
    return et(e(n, r)).pipe(Jp(1), Zp(n));
  });
}
function zp(e) {
  return $e(function(t, n) {
    var r, s = !1, i, o = function() {
      r = t.subscribe(He(n, void 0, void 0, function(a) {
        i || (i = new xt(), et(e(i)).subscribe(He(n, function() {
          return r ? o() : s = !0;
        }))), i && i.next(a);
      })), s && (r.unsubscribe(), r = null, s = !1, o());
    };
    o();
  });
}
function Xp(e, t) {
  return $e(qp(e, t, arguments.length >= 2, !0));
}
function _p(e) {
  e === void 0 && (e = {});
  var t = e.connector, n = t === void 0 ? function() {
    return new xt();
  } : t, r = e.resetOnError, s = r === void 0 ? !0 : r, i = e.resetOnComplete, o = i === void 0 ? !0 : i, a = e.resetOnRefCountZero, l = a === void 0 ? !0 : a;
  return function(c) {
    var u, h, m, g = 0, w = !1, p = !1, R = function() {
      h?.unsubscribe(), h = void 0;
    }, F = function() {
      R(), u = m = void 0, w = p = !1;
    }, I = function() {
      var O = u;
      F(), O?.unsubscribe();
    };
    return $e(function(O, E) {
      g++, !p && !w && R();
      var b = m = m ?? n();
      E.add(function() {
        g--, g === 0 && !p && !w && (h = _r(I, l));
      }), b.subscribe(E), !u && g > 0 && (u = new On({
        next: function(C) {
          return b.next(C);
        },
        error: function(C) {
          p = !0, R(), h = _r(F, s, C), b.error(C);
        },
        complete: function() {
          w = !0, R(), h = _r(F, o), b.complete();
        }
      }), et(O).subscribe(u));
    })(c);
  };
}
function _r(e, t) {
  for (var n = [], r = 2; r < arguments.length; r++)
    n[r - 2] = arguments[r];
  if (t === !0) {
    e();
    return;
  }
  if (t !== !1) {
    var s = new On({
      next: function() {
        s.unsubscribe(), e();
      }
    });
    return et(t.apply(void 0, Un([], Dn(n)))).subscribe(s);
  }
}
function $p(e, t, n) {
  var r, s, i, o, a = !1;
  return e && typeof e == "object" ? (r = e.bufferSize, o = r === void 0 ? 1 / 0 : r, s = e.windowTime, t = s === void 0 ? 1 / 0 : s, i = e.refCount, a = i === void 0 ? !1 : i, n = e.scheduler) : o = e ?? 1 / 0, _p({
    connector: function() {
      return new tr(o, t, n);
    },
    resetOnError: !0,
    resetOnComplete: !1,
    resetOnRefCountZero: a
  });
}
function eg(e, t) {
  return $e(function(n, r) {
    var s = null, i = 0, o = !1, a = function() {
      return o && !s && r.complete();
    };
    n.subscribe(He(r, function(l) {
      s?.unsubscribe();
      var c = 0, u = i++;
      et(e(l, u)).subscribe(s = He(r, function(h) {
        return r.next(t ? t(l, h, u, c++) : h);
      }, function() {
        s = null, a();
      }));
    }, function() {
      o = !0, a();
    }));
  });
}
function gn(e, t, n) {
  var r = Ae(e) || t || n ? { next: e, error: t, complete: n } : e;
  return r ? $e(function(s, i) {
    var o;
    (o = r.subscribe) === null || o === void 0 || o.call(r);
    var a = !0;
    s.subscribe(He(i, function(l) {
      var c;
      (c = r.next) === null || c === void 0 || c.call(r, l), i.next(l);
    }, function() {
      var l;
      a = !1, (l = r.complete) === null || l === void 0 || l.call(r), i.complete();
    }, function(l) {
      var c;
      a = !1, (c = r.error) === null || c === void 0 || c.call(r, l), i.error(l);
    }, function() {
      var l, c;
      a && ((l = r.unsubscribe) === null || l === void 0 || l.call(r)), (c = r.finalize) === null || c === void 0 || c.call(r);
    }));
  }) : Ws;
}
function tg(e) {
  const {
    conversationId: t,
    afterSeq: n = /* @__PURE__ */ L(0),
    baseUrl: r = Hu(),
    maxBackoffMs: s = 15e3,
    shouldReconnect: i = /* @__PURE__ */ L(!0),
    // По умолчанию переподключения включены
    onCreateNewConversation: o,
    onReconnected: a
  } = e, l = /* @__PURE__ */ L(!1), c = /* @__PURE__ */ si(null), u = /* @__PURE__ */ L([]), h = new xt(), m = new xt(), g = new xt(), w = /* @__PURE__ */ si(null), p = /* @__PURE__ */ new Map(), R = 2e4, F = /* @__PURE__ */ L(null), I = /* @__PURE__ */ L(Date.now()), O = 15e3, E = 1e4;
  function b() {
    w.value && (console.log("[WS] Cleaning up current socket connection"), w.value.complete(), w.value = null), l.value = !1;
  }
  function C() {
    M(), F.value = setInterval(() => {
      const U = w.value;
      l.value && U && (U.next({ type: "ping", data: {} }), setTimeout(() => {
        Date.now() - I.value > E && (console.warn("[WS] Pong timeout - triggering reconnection"), w.value && w.value.complete(), l.value = !1, c.value = new Error("Pong timeout"), M(), setTimeout(() => {
          m.next();
        }, 1e3));
      }, E));
    }, O);
  }
  function M() {
    F.value && (clearInterval(F.value), F.value = null);
  }
  function T() {
    if (!$.value)
      throw new Error("No conversation ID provided");
    const U = vp({
      url: $.value,
      serializer: (K) => JSON.stringify(K),
      deserializer: (K) => {
        try {
          return JSON.parse(K.data);
        } catch (oe) {
          throw console.warn("Failed to parse WebSocket message:", K.data), oe;
        }
      },
      openObserver: {
        next: () => {
          for (l.value = !0, c.value = null, I.value = Date.now(), C(), a && a(); u.value.length > 0; ) {
            const K = u.value.shift();
            if (K)
              try {
                U.next(K), console.log("[WS] Sent queued message:", K);
              } catch (oe) {
                console.warn("[WS] Failed to send queued message:", oe), u.value.unshift(K);
                break;
              }
          }
        }
      },
      closeObserver: {
        next: (K) => {
          l.value = !1, M(), console.log("[WS] Disconnected:", K.code, K.reason);
        }
      }
    });
    return w.value = U, U;
  }
  const $ = j(() => {
    if (!t.value) return "";
    const U = new URLSearchParams();
    return U.set("conv_id", t.value), n.value > 0 && U.set("after_seq", n.value.toString()), `${r}/api/v1/messages/ws?${U.toString()}`;
  }), _ = Wp(
    Pp(null),
    // Запускаем сразу
    m.pipe(
      gn(() => {
        console.log("[WS] Force reconnection triggered"), b();
      })
    ),
    g.pipe(
      gn(() => {
        console.log("[WS] Conversation changed, reconnecting"), b();
      })
    )
  ).pipe(
    eg(() => t.value ? (console.log("[WS] Creating new socket connection"), T().pipe(
      zp(
        (U) => U.pipe(
          gn((K) => {
            c.value = K, console.error("[WS] Error:", K);
          }),
          Ht(() => {
            const K = i.value;
            return K || console.log("[WS] Reconnection disabled, stopping retries"), K;
          }),
          Xp((K) => Math.min(K * 2 || 1e3, s), 0),
          Hp((K) => (console.log(`[WS] Retrying in ${K}ms...`), Lp(K)))
        )
      )
    )) : (console.log("[WS] Waiting for conversation ID"), Js)),
    $p({ bufferSize: 1, refCount: !1 })
  );
  function pe(U) {
    const K = w.value;
    if (l.value && K)
      try {
        if (K.next(U), console.log("[WS] Sent message:", U), U.type === "message.send" && U.data?.client_id) {
          const oe = U.data.client_id, ht = setTimeout(() => {
            console.warn(`[WS] Message ${oe} timeout - connection may be dead`), l.value = !1, c.value = new Error("Message delivery timeout"), p.delete(oe);
          }, R);
          p.set(oe, { timestamp: Date.now(), timeout: ht }), console.log(`[WS] Tracking message ${oe} for delivery`);
        }
      } catch (oe) {
        console.warn("[WS] Failed to send, adding to outbox:", oe), u.value.push(U);
      }
    else
      u.value.push(U);
  }
  function De(U, K, oe, ht) {
    if (!i.value)
      if (console.log("[WS] Re-enabling reconnections for new message"), i.value = !0, o)
        console.log("[WS] Creating new conversation for new message"), o().then(() => {
          console.log("[WS] New conversation created, creating socket connection");
          try {
            b(), T().subscribe();
          } catch (Dt) {
            console.error("[WS] Failed to create new connection:", Dt);
          }
        }).catch((Dt) => {
          console.error("[WS] Failed to create new conversation:", Dt);
        });
      else {
        console.log("[WS] Creating new connection for new message (no conversation callback)");
        try {
          b(), T().subscribe();
        } catch (Dt) {
          console.error("[WS] Failed to create new connection:", Dt);
        }
      }
    pe({
      type: "message.send",
      data: {
        text: U,
        client_id: K,
        reply_to_message_id: oe,
        attachments: ht
      }
    }), console.log("[WS] Queued message:", U);
  }
  const me = _.pipe(
    Ht((U) => !!U && typeof U == "object" && "type" in U),
    gn((U) => {
      if (c.value && (console.log("[WS] Received message, clearing connection error"), c.value = null), U.type === "pong" && (I.value = Date.now(), console.log("[WS] Received pong from server")), U.type === "message.created" && U.data?.client_id) {
        const K = U.data.client_id, oe = p.get(K);
        oe && (clearTimeout(oe.timeout), p.delete(K));
      }
    })
  ), ye = me.pipe(
    Ht((U) => U.type === "welcome")
  ), Ee = me.pipe(
    Ht(
      (U) => U.type === "message.created" || U.type === "conversation.closed"
    )
  ), X = me.pipe(Ht((U) => U.type === "conversation.closed")), Z = me.pipe(Ht((U) => U.type === "error")), re = j(() => l.value ? "CONNECTED" : c.value ? "ERROR" : "DISCONNECTED"), fe = j(() => u.value.length > 0);
  Oe(t, (U, K) => {
    U && U !== K && g.next();
  });
  const ce = _.subscribe({
    error: (U) => {
      c.value = U, console.error("[WS] Socket stream error:", U);
    }
  });
  return Yn(() => {
    console.log("[WS] Cleaning up..."), ce.unsubscribe();
    for (const [, U] of p)
      clearTimeout(U.timeout);
    p.clear(), M(), h.next(), h.complete(), m.complete(), g.complete(), w.value?.complete();
  }), {
    // State
    connected: j(() => l.value),
    statusText: re,
    lastError: j(() => c.value),
    hasQueuedMessages: fe,
    // RxJS Streams
    welcomeMessages$: ye,
    // Welcome сообщения при подключении
    newMessages$: Ee,
    // Новые сообщения чата
    errorMessages$: Z,
    // Ошибки от сервера
    closeConversation$: X,
    // Сообщения о закрытии беседы
    // Actions
    send: pe,
    // Отправка произвольного сообщения
    sendMessage: De,
    // Отправка текстового сообщения
    // Control methods
    disableReconnection: () => {
      i.value = !1, console.log("[WS] Reconnection disabled");
    },
    enableReconnection: () => {
      i.value = !0, console.log("[WS] Reconnection enabled");
    },
    disconnect: () => {
      i.value = !1, b(), console.log("[WS] Manually disconnecting...");
    }
  };
}
function ng() {
  const e = typeof globalThis < "u" ? globalThis.crypto : void 0;
  if (e && typeof e.randomUUID == "function")
    return e.randomUUID();
  if (e && typeof e.getRandomValues == "function") {
    const n = new Uint8Array(16);
    e.getRandomValues(n), n[6] = n[6] & 15 | 64, n[8] = n[8] & 63 | 128;
    const r = Array.from(n).map((s) => s.toString(16).padStart(2, "0"));
    return `${r.slice(0, 4).join("")}-${r.slice(4, 6).join("")}-${r.slice(6, 8).join("")}-${r.slice(8, 10).join("")}-${r.slice(10, 16).join("")}`;
  }
  const t = () => Math.floor((1 + Math.random()) * 65536).toString(16).substring(1);
  return `${t()}${t()}-${t()}-${t()}-${t()}${t()}${t()}`;
}
const rg = "data:audio/mpeg;base64,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08zVr2vZdaeZdadaeZdaeZiZiajZiajZ9mIaKGjRQ0UMGihooUNFDRYoaKK1TEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVRfDhGUSMfhXEtLcdqIYIdoqiNEnxMSBC7DTHIQsiB/D0kiKEwTMO8/FGyP4DWuVwxqhLHScx2nseyZSCnYH7yGUGhsgHxKCQCgsB4Oh4uojUXUTVURsGiUL//vUZCyP9lx1GAnpNtBqRSKFYYmmAAABpAAAACAAADSAAAAEDIeGg+ULqLqJnCxdAbMiohGg+VOF1F1E0jpUojYNEpEVOFjqS6iaSaRY6o2eJiEsdTSTSTSTSTKnF2HoUSqSSaV0mkmkWOqJqSInFllOznFlFiSj0FonGlM7O0lFlFFmWqpZ3Z2miyiyyj42adm/mpKLgAIAF/kbUtk7VEk/07EXyEQhMMJKiBCMuIPDFgoAi/oUGOkGRlwC/aJKGxcFEJGZKVMgBYHB3LB+XCEQyQP4tA8BUHgtB0NBWOBPPF6xOlSHZoWhJHIeROIQHjBGgRoF0ixdAbMioKjQfGVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV", sg = {
  key: 0,
  class: "absolute inset-0 z-50 flex items-center justify-center backdrop-blur-[25px] -m-4",
  style: { background: "rgba(108, 111, 172, 0.08)" }
}, ig = { class: "text-center text-neutral-50 font-golos" }, og = { class: "font-normal text-[12px] leading-[20px] text-neutral-50 font-unbounded" }, ag = {
  key: 0,
  class: "flex justify-center items-center gap-[3px] mt-[9px]"
}, lg = {
  id: "footer",
  class: "flex-shrink-0 w-full mt-[12px]"
}, cg = /* @__PURE__ */ ke({
  __name: "ChatContent",
  props: {
    msgColor: {},
    logoGradients: {},
    messageHistory: {},
    conversationId: {},
    isLoadingHistory: { type: Boolean },
    clientId: {},
    username: {},
    isOpen: { type: Boolean },
    onCreateNewConversation: { type: Function },
    chatInitError: {},
    isMobile: { type: Boolean }
  },
  emits: ["toggleUnreadMessage", "updateVisibleDate"],
  setup(e, { emit: t }) {
    const n = /* @__PURE__ */ L("loading"), r = e, s = t, i = /* @__PURE__ */ L(), o = /* @__PURE__ */ L(), a = /* @__PURE__ */ L(null);
    let l = null;
    const c = () => {
      l && l.disconnect(), l = new IntersectionObserver(
        (X) => {
          X.forEach((Z) => {
            const re = Z.target.getAttribute("data-message-id");
            re && (Z.isIntersecting ? O.value.add(re) : O.value.delete(re));
          }), O.value = new Set(O.value);
        },
        {
          root: i.value,
          threshold: 0.1
          // Сообщение считается видимым если видно 10% от него
        }
      ), i.value && i.value.querySelectorAll("[data-message-id]").forEach((Z) => {
        l?.observe(Z);
      });
    }, { newMessages$: u, sendMessage: h, connected: m, disableReconnection: g } = tg({
      conversationId: j(() => r.conversationId),
      onCreateNewConversation: r.onCreateNewConversation,
      onReconnected: () => {
        qe(() => {
          Ee();
        });
      }
    }), w = tf(), p = j(() => r.chatInitError ? n.value !== "over" && n.value !== "thankYou" : !m.value && n.value !== "over" && n.value !== "thankYou"), R = j(() => r.chatInitError ? "Чат недоступен. Попробуйте позже" : m.value ? "Подключено" : "Устанавливаем связь"), F = () => {
      try {
        const X = new Audio(rg);
        X.volume = 0.5, X.play().catch((Z) => {
          console.warn("[ChatContent] Failed to play notification sound:", Z);
        });
      } catch (X) {
        console.warn("[ChatContent] Error creating audio:", X);
      }
    }, I = /* @__PURE__ */ L([]), O = /* @__PURE__ */ L(/* @__PURE__ */ new Set());
    Oe(
      [I, O],
      ([X, Z]) => {
        if (X.length > 0 && Z.size > 0) {
          const re = X.filter((fe) => Z.has(fe.message_id));
          if (re.length > 0) {
            const fe = re.reduce(
              (ce, U) => ce.seq_no > U.seq_no ? ce : U
            );
            s("updateVisibleDate", fe.created_at);
          }
        } else if (X.length > 0) {
          const re = X[X.length - 1];
          s("updateVisibleDate", re.created_at);
        }
      },
      { deep: !0 }
    ), Oe(
      () => m.value,
      (X, Z) => {
        X && (n.value = "active", Z === !1 && qe(() => Ee()));
      }
    ), Qt(() => {
      if (r.conversationId && u) {
        const X = r.messageHistory.map((fe) => {
          let ce = null;
          return fe.reply_to_message_id && (ce = r.messageHistory.find((U) => U.message_id === fe.reply_to_message_id) || null), {
            ...fe,
            replyingMessage: ce
          };
        });
        I.value = X;
        const re = u.pipe(
          gn((fe) => {
            if (fe.type === "conversation.closed") {
              n.value = "over", g();
              return;
            }
            if (fe.type === "message.created") {
              const ce = fe.data;
              let U = null;
              if (ce.reply_to_message_id && (U = I.value.find((oe) => oe.message_id === ce.reply_to_message_id) || null), ce.sender === "user") {
                const oe = I.value.findIndex(
                  (ht) => ht.isReceived === !1 && ht.sender === "user" && ht.text === ce.text
                );
                if (oe !== -1) {
                  I.value[oe] = {
                    ...ce,
                    replyingMessage: U,
                    isReceived: !0
                  };
                  return;
                }
              }
              if (!I.value.some((oe) => oe.message_id === ce.message_id)) {
                const oe = {
                  ...ce,
                  replyingMessage: U
                };
                I.value.push(oe), r.isOpen || (s("toggleUnreadMessage"), (ce.sender === "support" || ce.sender === "system") && F()), qe(() => Ee());
              }
            }
          })
        ).subscribe();
        return () => {
          re.unsubscribe();
        };
      }
    });
    const E = (X, Z, re) => {
      let fe = null;
      Z && (fe = I.value.find((U) => U.message_id === Z) || null);
      const ce = {
        message_id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        conversation_id: r.conversationId,
        seq_no: I.value.length,
        // временный seq_no
        sender: "user",
        source: "web",
        content_type: "text",
        attachments: re || [],
        text: X,
        reply_to_message_id: Z,
        replyingMessage: fe,
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        isReceived: !1
        // флаг для отслеживания локальных сообщений
      };
      return I.value.push(ce), qe(() => Ee()), a.value && (a.value = null), ce;
    }, b = (X, Z, re) => {
      r.conversationId && (E(X, Z, re), h(
        X,
        ng(),
        Z,
        re?.map((fe) => fe.attachment_id) || []
      ));
    }, C = /* @__PURE__ */ L(null), M = /* @__PURE__ */ L({ x: 0, y: 0 }), T = (X, Z) => {
      if (C.value = Z, !i.value?.getBoundingClientRect()) return;
      const fe = 180, ce = 140;
      let U = X.clientX, K = X.clientY;
      U + fe > window.innerWidth && (U = window.innerWidth - fe - 10), K + ce > window.innerHeight && (K = K - ce), U < 10 && (U = 10), K < 10 && (K = 10), M.value = { x: U, y: K };
    }, $ = () => {
      C.value = null;
    }, _ = () => {
      C.value?.text && navigator.clipboard.writeText(C.value.text), $();
    }, pe = () => {
      a.value = C.value, $(), qe(() => {
        o.value?.focusInput();
      });
    }, De = async (X) => {
      try {
        await w.mutateAsync({
          conversation_id: r.conversationId,
          user_id: r.clientId || "",
          is_like: X
        }), n.value = "thankYou";
      } catch (Z) {
        console.error("Failed to rate conversation:", Z);
      }
    }, me = (X) => {
      const Z = X.target;
      Z.style.color = r.msgColor;
    }, ye = (X) => {
      const Z = X.target;
      Z.style.color = "white";
    }, Ee = () => {
      i.value && (i.value.scrollTop = i.value.scrollHeight);
    };
    return sn(async () => {
      await qe(), Ee(), c();
    }), Oe(
      I,
      async () => {
        await qe(), c();
      },
      { flush: "post" }
    ), Yn(() => {
      l && l.disconnect();
    }), (X, Z) => (D(), Y("div", {
      class: "w-full h-full flex flex-col min-h-0",
      onClick: $
    }, [
      p.value ? (D(), Y("div", sg, [
        y("div", ig, [
          y("div", og, Se(R.value), 1),
          !ee(m) && !e.chatInitError ? (D(), Y("div", ag, [...Z[1] || (Z[1] = [
            y("div", {
              class: "w-[4.8px] h-[4.8px] bg-white rounded-[100px]",
              style: { animation: "dotFade1 1.5s infinite", opacity: "0" }
            }, null, -1),
            y("div", {
              class: "w-[6.4px] h-[6.4px] bg-white rounded-[100px]",
              style: { animation: "dotFade2 1.5s infinite", opacity: "0" }
            }, null, -1),
            y("div", {
              class: "w-[8px] h-[8px] bg-white rounded-[100px]",
              style: { animation: "dotFade3 1.5s infinite", opacity: "0" }
            }, null, -1)
          ])])) : Ve("", !0)
        ])
      ])) : Ve("", !0),
      y("div", {
        ref_key: "chatContainer",
        ref: i,
        id: "chat",
        class: "w-full flex-1 overflow-auto space-y-3 custom-scrollbar min-h-0",
        style: {
          "scrollbar-width": "thin",
          "scrollbar-color": "rgba(255, 255, 255, 0.2) transparent"
        }
      }, [
        (D(!0), Y(ge, null, It(I.value, (re) => (D(), yt(Hd, Xo({
          key: re.seq_no,
          "data-message-id": re.message_id
        }, { ref_for: !0 }, re, {
          "is-mobile": e.isMobile,
          msgColor: r.msgColor,
          logoGradients: r.logoGradients,
          isMenuOpen: C.value?.message_id === re.message_id,
          isRead: !0,
          onOpenMenu: (fe) => T(fe, re),
          username: e.username,
          onCloseMenu: $
        }), null, 16, ["data-message-id", "is-mobile", "msgColor", "logoGradients", "isMenuOpen", "onOpenMenu", "username"]))), 128))
      ], 512),
      y("div", lg, [
        J(Zh, {
          ref_key: "chatFooterRef",
          ref: o,
          accentColor: e.msgColor,
          sendMessage: b,
          canSendMessages: !!e.conversationId,
          replyingMessage: a.value,
          conversationId: e.conversationId,
          chatState: n.value,
          "is-mobile": e.isMobile,
          onSendRateConversation: De
        }, null, 8, ["accentColor", "canSendMessages", "replyingMessage", "conversationId", "chatState", "is-mobile"])
      ]),
      Bs(y("div", {
        class: "fixed z-50 flex flex-col gap-3 bg-[#131525] p-4 rounded-[20px] shadow-lg min-w-[180px]",
        style: Ke({ left: M.value.x + "px", top: M.value.y + "px" }),
        onClick: Z[0] || (Z[0] = Bn(() => {
        }, ["stop"]))
      }, [
        y("button", {
          onClick: pe,
          class: "flex items-center gap-2 self-stretch text-white transition-colors",
          onMouseenter: me,
          onMouseleave: ye
        }, [
          J(ee(_d), { class: "w-6 h-6" }),
          Z[2] || (Z[2] = y("span", { class: "font-medium text-sm text-center text-nowrap" }, "Ответить", -1))
        ], 32),
        C.value?.text?.length ? (D(), Y("button", {
          key: 0,
          onClick: _,
          class: "flex items-center gap-2 self-stretch text-white transition-colors",
          onMouseenter: me,
          onMouseleave: ye
        }, [
          J(ee(tp), { class: "w-6 h-6" }),
          Z[3] || (Z[3] = y("span", { class: "font-medium text-sm text-center text-nowrap" }, "Скопировать текст", -1))
        ], 32)) : Ve("", !0)
      ], 4), [
        [na, C.value]
      ])
    ]));
  }
}), ug = {
  xmlns: "http://www.w3.org/2000/svg",
  width: "6",
  height: "12",
  fill: "none"
};
function fg(e, t) {
  return D(), Y("svg", ug, [...t[0] || (t[0] = [
    y("path", {
      fill: "#F8FAFC",
      "fill-rule": "evenodd",
      d: "M5.468.414a.75.75 0 0 1 .118 1.055L1.96 6l3.626 4.531a.75.75 0 1 1-1.172.938l-4-5a.75.75 0 0 1 0-.937l4-5A.75.75 0 0 1 5.468.414",
      "clip-rule": "evenodd"
    }, null, -1)
  ])]);
}
const hg = { render: fg }, dg = {
  key: 0,
  class: "fixed inset-0 w-full h-full backdrop-blur-sm bg-black/20 z-20"
}, pg = { class: "absolute inset-0 w-full h-full" }, gg = { class: "relative z-10 w-full h-full flex flex-col gap-[12px]" }, mg = /* @__PURE__ */ ke({
  __name: "OgLiveChat.ce",
  props: {
    position: { default: "bottom-right", type: String },
    sizeClass: { default: "w-[342px] h-[600px]", type: String },
    theme: { default: "mos", type: String },
    userId: { default: void 0, type: String },
    userName: { default: void 0, type: String },
    topic: { default: void 0, type: String },
    apiBaseUrl: { default: void 0, type: String },
    wsBaseUrl: { default: void 0, type: String }
  },
  setup(e) {
    const t = /* @__PURE__ */ L(!1), n = /* @__PURE__ */ L(!1), r = /* @__PURE__ */ L(!1), s = e;
    Oe(
      () => [s.apiBaseUrl, s.wsBaseUrl],
      ([ye, Ee]) => {
        Ju(ye, Ee);
      },
      { immediate: !0 }
    );
    const {
      conversationId: i,
      messageHistory: o,
      isLoadingHistory: a,
      createNewConversation: l,
      error: c
    } = nf({
      userId: j(() => s.userId || ""),
      userName: j(() => s.userName || ""),
      topic: j(() => s.topic || ""),
      needToInitializeChat: j(() => n.value)
      // Инициализируем только когда открыт чат
    }), u = /* @__PURE__ */ L(/* @__PURE__ */ new Date()), h = (ye) => {
      u.value = ye;
    }, m = (ye) => {
      if (!t.value) return;
      const Ee = ye.target;
      if (!Ee) return;
      Ee.closest("og-chat") || (t.value = !1);
    };
    Oe(t, (ye) => {
      ye && !n.value && (n.value = !0), t.value && (r.value = !1);
    });
    const g = () => {
      t.value || (r.value = !0);
    }, { shouldUseFullscreen: w } = Lu(), p = j(() => w.value && t.value), R = j(() => p.value ? [
      "fixed inset-0 z-40",
      "flex flex-col justify-end items-center",
      // Прижимаем к низу
      "w-full h-full"
    ].join(" ") : t.value ? [b.value, "fixed flex flex-col justify-end"].join(" ") : ["fixed pointer-events-none"].join(" ")), F = j(() => p.value ? [
      T.value,
      "relative overflow-hidden",
      "w-full",
      "z-30",
      // Чат поверх подложки (такой же как кнопка)
      "rounded-t-[32px]"
    ].join(" ") : T.value + " relative overflow-hidden rounded-[32px]"), I = j(() => p.value ? {
      height: "calc(var(--app-vh, 100vh) * 0.8)",
      maxHeight: "calc(var(--app-vh, 100vh) * 0.8)"
    } : {}), O = j(() => p.value ? {
      bottom: "calc(var(--app-vh, 100vh) * 0.8 + 62px)",
      // Высота чата + отступ
      left: "16px"
    } : {});
    function E() {
      const ye = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      document.documentElement.style.setProperty("--app-vh", `${ye}px`);
    }
    sn(() => {
      E(), window.visualViewport?.addEventListener("resize", E), window.addEventListener("resize", E), document.addEventListener("pointerdown", m, { capture: !0 }), document.addEventListener("touchstart", m, { capture: !0 });
    }), zl(() => {
      window.visualViewport?.removeEventListener("resize", E), window.removeEventListener("resize", E), document.documentElement.style.removeProperty("--app-vh"), document.removeEventListener("pointerdown", m, { capture: !0 }), document.removeEventListener("touchstart", m, { capture: !0 });
    }), Oe(p, (ye) => {
      ye ? document.body.style.overflow = "hidden" : document.body.style.overflow = "";
    });
    const {
      sizeClasses: b,
      buttonClasses: C,
      buttonContainerClasses: M,
      chatWindowClasses: T,
      gradients: $,
      mainAccent: _,
      logoGradients: pe,
      buttonBg: De
    } = Nu(s), me = () => {
      t.value = !t.value;
    };
    return (ye, Ee) => (D(), Y("div", {
      id: "chatContainer",
      class: be(R.value)
    }, [
      ee(w) && t.value ? (D(), Y("div", dg, [
        y("div", {
          class: "absolute z-40",
          style: Ke(O.value)
        }, [
          y("button", {
            class: "h-[36px] w-[83px] flex items-center px-1 py-2 rounded-xl backdrop-blur-[25px]",
            style: { background: "rgba(108, 111, 172, 0.08)" },
            onClick: me
          }, [
            J(ee(hg), { class: "mx-[10px]" }),
            Ee[0] || (Ee[0] = y("span", { class: "font-medium text-sm text-center text-neutral-50" }, "Назад", -1))
          ])
        ], 4)
      ])) : Ve("", !0),
      n.value ? Bs((D(), Y("div", {
        key: 1,
        class: be([F.value, "relative"]),
        style: Ke(I.value)
      }, [
        y("div", pg, [
          J(wf, {
            gradients: ee($),
            class: "w-full h-full"
          }, null, 8, ["gradients"])
        ]),
        y("div", gg, [
          J(Vf, { "visible-message-date": u.value }, null, 8, ["visible-message-date"]),
          J(cg, {
            "msg-color": ee(_),
            "logo-gradients": ee(pe),
            "message-history": ee(o),
            "conversation-id": ee(i),
            "is-loading-history": ee(a),
            "client-id": e.userId,
            username: e.userName,
            "on-create-new-conversation": ee(l),
            "chat-init-error": ee(c),
            isOpen: t.value,
            "is-mobile": ee(w),
            onToggleUnreadMessage: g,
            onUpdateVisibleDate: h
          }, null, 8, ["msg-color", "logo-gradients", "message-history", "conversation-id", "is-loading-history", "client-id", "username", "on-create-new-conversation", "chat-init-error", "isOpen", "is-mobile"])
        ])
      ], 6)), [
        [na, t.value]
      ]) : Ve("", !0),
      t.value && ee(w) ? Ve("", !0) : (D(), Y("div", {
        key: 2,
        class: be([ee(M), "pointer-events-auto"])
      }, [
        y("button", {
          onClick: me,
          class: be([
            ee(C),
            "flex mt-[16px] items-center justify-center active:scale-95 relative"
          ]),
          style: Ke({
            outline: "none",
            background: ee(De)
          }),
          "aria-label": "Открыть чат"
        }, [
          J(ee(of)),
          r.value ? (D(), Y("div", {
            key: 0,
            class: "absolute top-0 right-0 w-2.5 h-2.5 rounded-[100px] outline-4 outline-t-4 outline-l-4 outline-r-4 outline-b-4 outline outline-[#0b0b0c]",
            style: Ke({ backgroundColor: ee(_) })
          }, null, 4)) : Ve("", !0)
        ], 6)
      ], 2))
    ], 2));
  }
}), vg = '*,:before,:after{--tw-border-spacing-x: 0;--tw-border-spacing-y: 0;--tw-translate-x: 0;--tw-translate-y: 0;--tw-rotate: 0;--tw-skew-x: 0;--tw-skew-y: 0;--tw-scale-x: 1;--tw-scale-y: 1;--tw-pan-x: ;--tw-pan-y: ;--tw-pinch-zoom: ;--tw-scroll-snap-strictness: proximity;--tw-gradient-from-position: ;--tw-gradient-via-position: ;--tw-gradient-to-position: ;--tw-ordinal: ;--tw-slashed-zero: ;--tw-numeric-figure: ;--tw-numeric-spacing: ;--tw-numeric-fraction: ;--tw-ring-inset: ;--tw-ring-offset-width: 0px;--tw-ring-offset-color: #fff;--tw-ring-color: rgb(59 130 246 / .5);--tw-ring-offset-shadow: 0 0 #0000;--tw-ring-shadow: 0 0 #0000;--tw-shadow: 0 0 #0000;--tw-shadow-colored: 0 0 #0000;--tw-blur: ;--tw-brightness: ;--tw-contrast: ;--tw-grayscale: ;--tw-hue-rotate: ;--tw-invert: ;--tw-saturate: ;--tw-sepia: ;--tw-drop-shadow: ;--tw-backdrop-blur: ;--tw-backdrop-brightness: ;--tw-backdrop-contrast: ;--tw-backdrop-grayscale: ;--tw-backdrop-hue-rotate: ;--tw-backdrop-invert: ;--tw-backdrop-opacity: ;--tw-backdrop-saturate: ;--tw-backdrop-sepia: ;--tw-contain-size: ;--tw-contain-layout: ;--tw-contain-paint: ;--tw-contain-style: }::backdrop{--tw-border-spacing-x: 0;--tw-border-spacing-y: 0;--tw-translate-x: 0;--tw-translate-y: 0;--tw-rotate: 0;--tw-skew-x: 0;--tw-skew-y: 0;--tw-scale-x: 1;--tw-scale-y: 1;--tw-pan-x: ;--tw-pan-y: ;--tw-pinch-zoom: ;--tw-scroll-snap-strictness: proximity;--tw-gradient-from-position: ;--tw-gradient-via-position: ;--tw-gradient-to-position: ;--tw-ordinal: ;--tw-slashed-zero: ;--tw-numeric-figure: ;--tw-numeric-spacing: ;--tw-numeric-fraction: ;--tw-ring-inset: ;--tw-ring-offset-width: 0px;--tw-ring-offset-color: #fff;--tw-ring-color: rgb(59 130 246 / .5);--tw-ring-offset-shadow: 0 0 #0000;--tw-ring-shadow: 0 0 #0000;--tw-shadow: 0 0 #0000;--tw-shadow-colored: 0 0 #0000;--tw-blur: ;--tw-brightness: ;--tw-contrast: ;--tw-grayscale: ;--tw-hue-rotate: ;--tw-invert: ;--tw-saturate: ;--tw-sepia: ;--tw-drop-shadow: ;--tw-backdrop-blur: ;--tw-backdrop-brightness: ;--tw-backdrop-contrast: ;--tw-backdrop-grayscale: ;--tw-backdrop-hue-rotate: ;--tw-backdrop-invert: ;--tw-backdrop-opacity: ;--tw-backdrop-saturate: ;--tw-backdrop-sepia: ;--tw-contain-size: ;--tw-contain-layout: ;--tw-contain-paint: ;--tw-contain-style: }*,:before,:after{box-sizing:border-box;border-width:0;border-style:solid;border-color:#e5e7eb}:before,:after{--tw-content: ""}html,:host{line-height:1.5;-webkit-text-size-adjust:100%;-moz-tab-size:4;-o-tab-size:4;tab-size:4;font-family:ui-sans-serif,system-ui,sans-serif,"Apple Color Emoji","Segoe UI Emoji",Segoe UI Symbol,"Noto Color Emoji";font-feature-settings:normal;font-variation-settings:normal;-webkit-tap-highlight-color:transparent}body{margin:0;line-height:inherit}hr{height:0;color:inherit;border-top-width:1px}abbr:where([title]){-webkit-text-decoration:underline dotted;text-decoration:underline dotted}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}a{color:inherit;text-decoration:inherit}b,strong{font-weight:bolder}code,kbd,samp,pre{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace;font-feature-settings:normal;font-variation-settings:normal;font-size:1em}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-.25em}sup{top:-.5em}table{text-indent:0;border-color:inherit;border-collapse:collapse}button,input,optgroup,select,textarea{font-family:inherit;font-feature-settings:inherit;font-variation-settings:inherit;font-size:100%;font-weight:inherit;line-height:inherit;letter-spacing:inherit;color:inherit;margin:0;padding:0}button,select{text-transform:none}button,input:where([type=button]),input:where([type=reset]),input:where([type=submit]){-webkit-appearance:button;background-color:transparent;background-image:none}:-moz-focusring{outline:auto}:-moz-ui-invalid{box-shadow:none}progress{vertical-align:baseline}::-webkit-inner-spin-button,::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}summary{display:list-item}blockquote,dl,dd,h1,h2,h3,h4,h5,h6,hr,figure,p,pre{margin:0}fieldset{margin:0;padding:0}legend{padding:0}ol,ul,menu{list-style:none;margin:0;padding:0}dialog{padding:0}textarea{resize:vertical}input::-moz-placeholder,textarea::-moz-placeholder{opacity:1;color:#9ca3af}input::placeholder,textarea::placeholder{opacity:1;color:#9ca3af}button,[role=button]{cursor:pointer}:disabled{cursor:default}img,svg,video,canvas,audio,iframe,embed,object{display:block;vertical-align:middle}img,video{max-width:100%;height:auto}[hidden]:where(:not([hidden=until-found])){display:none}.container{width:100%}@media(min-width:640px){.container{max-width:640px}}@media(min-width:768px){.container{max-width:768px}}@media(min-width:1024px){.container{max-width:1024px}}@media(min-width:1280px){.container{max-width:1280px}}@media(min-width:1536px){.container{max-width:1536px}}.pointer-events-none{pointer-events:none}.pointer-events-auto{pointer-events:auto}.visible{visibility:visible}.fixed{position:fixed}.absolute{position:absolute}.relative{position:relative}.inset-0{inset:0}.bottom-\\[150px\\]{bottom:150px}.bottom-\\[8px\\]{bottom:8px}.left-\\[8px\\]{left:8px}.right-0{right:0}.right-\\[120px\\]{right:120px}.right-\\[8px\\]{right:8px}.top-0{top:0}.top-\\[8px\\]{top:8px}.z-10{z-index:10}.z-20{z-index:20}.z-30{z-index:30}.z-40{z-index:40}.z-50{z-index:50}.col-span-2{grid-column:span 2 / span 2}.row-span-2{grid-row:span 2 / span 2}.-m-4{margin:-1rem}.mx-\\[10px\\]{margin-left:10px;margin-right:10px}.mb-0\\.5{margin-bottom:.125rem}.mb-1{margin-bottom:.25rem}.mb-\\[12px\\]{margin-bottom:12px}.mb-\\[16px\\]{margin-bottom:16px}.mb-\\[24px\\]{margin-bottom:24px}.mr-\\[6px\\]{margin-right:6px}.mt-\\[10px\\]{margin-top:10px}.mt-\\[12px\\]{margin-top:12px}.mt-\\[16px\\]{margin-top:16px}.mt-\\[9px\\]{margin-top:9px}.inline-block{display:inline-block}.inline{display:inline}.flex{display:flex}.grid{display:grid}.hidden{display:none}.aspect-\\[106\\/103\\]{aspect-ratio:106/103}.aspect-\\[106\\/137\\]{aspect-ratio:106/137}.aspect-\\[106\\/208\\]{aspect-ratio:106/208}.aspect-\\[162\\/240\\]{aspect-ratio:162/240}.aspect-\\[162\\/80\\]{aspect-ratio:162/80}.aspect-\\[214\\/208\\]{aspect-ratio:214/208}.aspect-\\[3\\/4\\]{aspect-ratio:3/4}.aspect-square{aspect-ratio:1 / 1}.h-2\\.5{height:.625rem}.h-6{height:1.5rem}.h-\\[108px\\]{height:108px}.h-\\[18px\\]{height:18px}.h-\\[23\\.999998092651367px\\]{height:23.999998092651367px}.h-\\[24px\\]{height:24px}.h-\\[36px\\]{height:36px}.h-\\[4\\.8px\\]{height:4.8px}.h-\\[40px\\]{height:40px}.h-\\[44px\\]{height:44px}.h-\\[52px\\]{height:52px}.h-\\[536px\\]{height:536px}.h-\\[6\\.4px\\]{height:6.4px}.h-\\[600px\\]{height:600px}.h-\\[8px\\]{height:8px}.h-full{height:100%}.max-h-\\[120px\\]{max-height:120px}.min-h-0{min-height:0px}.min-h-\\[103px\\]{min-height:103px}.min-h-\\[137px\\]{min-height:137px}.min-h-\\[208px\\]{min-height:208px}.min-h-\\[243px\\]{min-height:243px}.min-h-\\[24px\\]{min-height:24px}.min-h-\\[44px\\]{min-height:44px}.min-h-\\[80px\\]{min-height:80px}.w-2\\.5{width:.625rem}.w-6{width:1.5rem}.w-\\[202px\\]{width:202px}.w-\\[225px\\]{width:225px}.w-\\[23\\.999998092651367px\\]{width:23.999998092651367px}.w-\\[24px\\]{width:24px}.w-\\[342px\\]{width:342px}.w-\\[36px\\]{width:36px}.w-\\[4\\.8px\\]{width:4.8px}.w-\\[40px\\]{width:40px}.w-\\[44px\\]{width:44px}.w-\\[52px\\]{width:52px}.w-\\[6\\.4px\\]{width:6.4px}.w-\\[83px\\]{width:83px}.w-\\[8px\\]{width:8px}.w-full{width:100%}.min-w-0{min-width:0px}.min-w-\\[106px\\]{min-width:106px}.min-w-\\[120px\\]{min-width:120px}.min-w-\\[162px\\]{min-width:162px}.min-w-\\[180px\\]{min-width:180px}.min-w-\\[183px\\]{min-width:183px}.min-w-\\[214px\\]{min-width:214px}.min-w-\\[80px\\]{min-width:80px}.max-w-\\[85\\%\\]{max-width:85%}.max-w-sm{max-width:24rem}.flex-1{flex:1 1 0%}.flex-shrink-0{flex-shrink:0}.grow{flex-grow:1}.cursor-default{cursor:default}.cursor-not-allowed{cursor:not-allowed}.cursor-pointer{cursor:pointer}.resize-none{resize:none}.resize{resize:both}.grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}.grid-cols-\\[1fr_auto\\]{grid-template-columns:1fr auto}.grid-rows-2{grid-template-rows:repeat(2,minmax(0,1fr))}.grid-rows-3{grid-template-rows:repeat(3,minmax(0,1fr))}.flex-col{flex-direction:column}.flex-wrap{flex-wrap:wrap}.items-end{align-items:flex-end}.items-center{align-items:center}.justify-start{justify-content:flex-start}.justify-end{justify-content:flex-end}.justify-center{justify-content:center}.gap-0\\.5{gap:.125rem}.gap-2{gap:.5rem}.gap-2\\.5{gap:.625rem}.gap-3{gap:.75rem}.gap-\\[10px\\]{gap:10px}.gap-\\[12px\\]{gap:12px}.gap-\\[15px\\]{gap:15px}.gap-\\[3px\\]{gap:3px}.gap-\\[4px\\]{gap:4px}.gap-\\[6px\\]{gap:6px}.gap-\\[8px\\]{gap:8px}.space-y-3>:not([hidden])~:not([hidden]){--tw-space-y-reverse: 0;margin-top:calc(.75rem * calc(1 - var(--tw-space-y-reverse)));margin-bottom:calc(.75rem * var(--tw-space-y-reverse))}.self-stretch{align-self:stretch}.overflow-auto{overflow:auto}.overflow-hidden{overflow:hidden}.overflow-y-auto{overflow-y:auto}.truncate{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.whitespace-nowrap{white-space:nowrap}.whitespace-pre-wrap{white-space:pre-wrap}.text-nowrap{text-wrap:nowrap}.break-words{overflow-wrap:break-word}.rounded{border-radius:.25rem}.rounded-\\[100px\\]{border-radius:100px}.rounded-\\[12px\\]{border-radius:12px}.rounded-\\[20px\\]{border-radius:20px}.rounded-\\[24px\\]{border-radius:24px}.rounded-\\[2px\\]{border-radius:2px}.rounded-\\[32px\\]{border-radius:32px}.rounded-\\[8px\\]{border-radius:8px}.rounded-full{border-radius:9999px}.rounded-lg{border-radius:.5rem}.rounded-xl{border-radius:.75rem}.rounded-t-\\[20px\\]{border-top-left-radius:20px;border-top-right-radius:20px}.rounded-t-\\[32px\\]{border-top-left-radius:32px;border-top-right-radius:32px}.rounded-bl-\\[20px\\]{border-bottom-left-radius:20px}.rounded-br-\\[20px\\]{border-bottom-right-radius:20px}.rounded-tl-\\[20px\\]{border-top-left-radius:20px}.rounded-tr-\\[20px\\]{border-top-right-radius:20px}.border{border-width:1px}.border-none{border-style:none}.border-gray-200{--tw-border-opacity: 1;border-color:rgb(229 231 235 / var(--tw-border-opacity, 1))}.bg-\\[\\#0e0f19\\]{--tw-bg-opacity: 1;background-color:rgb(14 15 25 / var(--tw-bg-opacity, 1))}.bg-\\[\\#131525\\]{--tw-bg-opacity: 1;background-color:rgb(19 21 37 / var(--tw-bg-opacity, 1))}.bg-black\\/20{background-color:#0003}.bg-black\\/60{background-color:#0009}.bg-gray-200{--tw-bg-opacity: 1;background-color:rgb(229 231 235 / var(--tw-bg-opacity, 1))}.bg-gray-50{--tw-bg-opacity: 1;background-color:rgb(249 250 251 / var(--tw-bg-opacity, 1))}.bg-transparent{background-color:transparent}.bg-white{--tw-bg-opacity: 1;background-color:rgb(255 255 255 / var(--tw-bg-opacity, 1))}.object-cover{-o-object-fit:cover;object-fit:cover}.p-2{padding:.5rem}.p-4{padding:1rem}.p-\\[12px\\]{padding:12px}.p-\\[4px\\]{padding:4px}.px-1{padding-left:.25rem;padding-right:.25rem}.px-2{padding-left:.5rem;padding-right:.5rem}.px-3{padding-left:.75rem;padding-right:.75rem}.px-\\[12px\\]{padding-left:12px;padding-right:12px}.px-\\[14px\\]{padding-left:14px;padding-right:14px}.py-1{padding-top:.25rem;padding-bottom:.25rem}.py-2{padding-top:.5rem;padding-bottom:.5rem}.py-\\[10px\\]{padding-top:10px;padding-bottom:10px}.py-\\[12px\\]{padding-top:12px;padding-bottom:12px}.py-\\[4px\\]{padding-top:4px;padding-bottom:4px}.py-\\[8px\\]{padding-top:8px;padding-bottom:8px}.pb-0\\.5{padding-bottom:.125rem}.pl-\\[10px\\]{padding-left:10px}.pr-\\[4px\\]{padding-right:4px}.text-left{text-align:left}.text-center{text-align:center}.text-start{text-align:start}.font-golos{font-family:Golos Text,Inter,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif}.font-unbounded{font-family:Unbounded,Outfit,Inter,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif}.text-2xl{font-size:1.5rem;line-height:2rem}.text-\\[10px\\]{font-size:10px}.text-\\[12px\\]{font-size:12px}.text-\\[16px\\]{font-size:16px}.text-\\[24px\\]{font-size:24px}.text-sm{font-size:.875rem;line-height:1.25rem}.text-xs{font-size:.75rem;line-height:1rem}.font-medium{font-weight:500}.font-normal{font-weight:400}.font-semibold{font-weight:600}.leading-3{line-height:.75rem}.leading-6{line-height:1.5rem}.leading-\\[10px\\]{line-height:10px}.leading-\\[20px\\]{line-height:20px}.leading-\\[28px\\]{line-height:28px}.leading-tight{line-height:1.25}.text-\\[\\#64748B\\],.text-\\[\\#64748b\\]{--tw-text-opacity: 1;color:rgb(100 116 139 / var(--tw-text-opacity, 1))}.text-gray-600{--tw-text-opacity: 1;color:rgb(75 85 99 / var(--tw-text-opacity, 1))}.text-gray-800{--tw-text-opacity: 1;color:rgb(31 41 55 / var(--tw-text-opacity, 1))}.text-neutral-50{--tw-text-opacity: 1;color:rgb(250 250 250 / var(--tw-text-opacity, 1))}.text-slate-500{--tw-text-opacity: 1;color:rgb(100 116 139 / var(--tw-text-opacity, 1))}.text-white{--tw-text-opacity: 1;color:rgb(255 255 255 / var(--tw-text-opacity, 1))}.placeholder-\\[\\#64748b\\]::-moz-placeholder{--tw-placeholder-opacity: 1;color:rgb(100 116 139 / var(--tw-placeholder-opacity, 1))}.placeholder-\\[\\#64748b\\]::placeholder{--tw-placeholder-opacity: 1;color:rgb(100 116 139 / var(--tw-placeholder-opacity, 1))}.opacity-0{opacity:0}.opacity-50{opacity:.5}.shadow-lg{--tw-shadow: 0 10px 15px -3px rgb(0 0 0 / .1), 0 4px 6px -4px rgb(0 0 0 / .1);--tw-shadow-colored: 0 10px 15px -3px var(--tw-shadow-color), 0 4px 6px -4px var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000),var(--tw-ring-shadow, 0 0 #0000),var(--tw-shadow)}.outline-none{outline:2px solid transparent;outline-offset:2px}.outline{outline-style:solid}.outline-4{outline-width:4px}.outline-\\[\\#0b0b0c\\]{outline-color:#0b0b0c}.filter{filter:var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow)}.backdrop-blur{--tw-backdrop-blur: blur(8px);-webkit-backdrop-filter:var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);backdrop-filter:var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia)}.backdrop-blur-\\[20px\\]{--tw-backdrop-blur: blur(20px);-webkit-backdrop-filter:var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);backdrop-filter:var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia)}.backdrop-blur-\\[25px\\]{--tw-backdrop-blur: blur(25px);-webkit-backdrop-filter:var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);backdrop-filter:var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia)}.backdrop-blur-sm{--tw-backdrop-blur: blur(4px);-webkit-backdrop-filter:var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);backdrop-filter:var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia)}.transition-colors{transition-property:color,background-color,border-color,text-decoration-color,fill,stroke;transition-timing-function:cubic-bezier(.4,0,.2,1);transition-duration:.15s}.transition-opacity{transition-property:opacity;transition-timing-function:cubic-bezier(.4,0,.2,1);transition-duration:.15s}.transition-transform{transition-property:transform;transition-timing-function:cubic-bezier(.4,0,.2,1);transition-duration:.15s}.duration-200{transition-duration:.2s}@keyframes dotFade1{0%,20%{opacity:1}20%,to{opacity:0}}@keyframes dotFade2{0%,33%{opacity:0}33%,53%{opacity:1}53%,to{opacity:0}}@keyframes dotFade3{0%,66%{opacity:0}66%,86%{opacity:1}86%,to{opacity:0}}.hover\\:scale-105:hover{--tw-scale-x: 1.05;--tw-scale-y: 1.05;transform:translate(var(--tw-translate-x),var(--tw-translate-y)) rotate(var(--tw-rotate)) skew(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.hover\\:text-neutral-50:hover{--tw-text-opacity: 1;color:rgb(250 250 250 / var(--tw-text-opacity, 1))}.focus\\:border-none:focus{border-style:none}.focus\\:shadow-none:focus{--tw-shadow: 0 0 #0000;--tw-shadow-colored: 0 0 #0000;box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000),var(--tw-ring-shadow, 0 0 #0000),var(--tw-shadow)}.focus\\:outline-none:focus{outline:2px solid transparent;outline-offset:2px}.focus\\:ring-0:focus{--tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);--tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(0px + var(--tw-ring-offset-width)) var(--tw-ring-color);box-shadow:var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow, 0 0 #0000)}.focus-visible\\:outline-none:focus-visible{outline:2px solid transparent;outline-offset:2px}.active\\:scale-95:active{--tw-scale-x: .95;--tw-scale-y: .95;transform:translate(var(--tw-translate-x),var(--tw-translate-y)) rotate(var(--tw-rotate)) skew(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.disabled\\:cursor-not-allowed:disabled{cursor:not-allowed}.group:hover .group-hover\\:opacity-100{opacity:1}', yg = ":host{font-family:Golos Text,Inter,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif}.font-golos{font-family:Golos Text,Inter,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif}.font-outfit{font-family:Outfit,Inter,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif}.font-unbounded{font-family:Unbounded,Outfit,Inter,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif}#chatContainer,og-chat{font-family:Golos Text,Inter,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif}.chat-content,.chat-message,.chat-input,.chat-button{font-family:Golos Text,Inter,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif}*{font-family:inherit}";
function wg() {
  if (document.querySelector('link[href*="fonts.googleapis.com"][href*="Golos+Text"]'))
    return;
  const t = document.createElement("link");
  t.rel = "preconnect", t.href = "https://fonts.googleapis.com", document.head.appendChild(t);
  const n = document.createElement("link");
  n.rel = "preconnect", n.href = "https://fonts.gstatic.com", n.crossOrigin = "anonymous", document.head.appendChild(n);
  const r = document.createElement("link");
  r.rel = "stylesheet", r.href = "https://fonts.googleapis.com/css2?family=Golos+Text:wght@400..900&family=Outfit:wght@100..900&family=Unbounded:wght@200..900&display=swap", document.head.appendChild(r);
}
const bg = new ga({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 15e3,
      refetchOnWindowFocus: !1,
      gcTime: 3e4
    },
    mutations: {
      retry: 1
    }
  }
}), Ag = /* @__PURE__ */ $c(mg, {
  styles: [yg, vg],
  configureApp(e) {
    e.use(Pu, { queryClient: bg });
  }
});
wg();
customElements.define("og-chat", Ag);
export {
  Ag as default
};
