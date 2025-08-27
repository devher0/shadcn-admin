
// Imports
import * as _0_0 from "//Users/nick/Projects/ops8/shadcn-admin/src/api/healthz.ts";
import * as _0_1 from "//Users/nick/Projects/ops8/shadcn-admin/src/api/metrics.ts";
import * as _0_2 from "//Users/nick/Projects/ops8/shadcn-admin/src/api/readyz.ts";


export const routeBase = "/api";

const internal  = [
  _0_0.default && {
        source     : "src/api/healthz.ts?fn=default",
        method     : "use",
        route      : "/healthz",
        path       : "/api/healthz",
        url        : "/api/healthz",
        cb         : _0_0.default,
      },
  _0_0.GET && {
        source     : "src/api/healthz.ts?fn=GET",
        method     : "get",
        route      : "/healthz",
        path       : "/api/healthz",
        url        : "/api/healthz",
        cb         : _0_0.GET,
      },
  _0_0.PUT && {
        source     : "src/api/healthz.ts?fn=PUT",
        method     : "put",
        route      : "/healthz",
        path       : "/api/healthz",
        url        : "/api/healthz",
        cb         : _0_0.PUT,
      },
  _0_0.POST && {
        source     : "src/api/healthz.ts?fn=POST",
        method     : "post",
        route      : "/healthz",
        path       : "/api/healthz",
        url        : "/api/healthz",
        cb         : _0_0.POST,
      },
  _0_0.PATCH && {
        source     : "src/api/healthz.ts?fn=PATCH",
        method     : "patch",
        route      : "/healthz",
        path       : "/api/healthz",
        url        : "/api/healthz",
        cb         : _0_0.PATCH,
      },
  _0_0.DELETE && {
        source     : "src/api/healthz.ts?fn=DELETE",
        method     : "delete",
        route      : "/healthz",
        path       : "/api/healthz",
        url        : "/api/healthz",
        cb         : _0_0.DELETE,
      },
  _0_1.default && {
        source     : "src/api/metrics.ts?fn=default",
        method     : "use",
        route      : "/metrics",
        path       : "/api/metrics",
        url        : "/api/metrics",
        cb         : _0_1.default,
      },
  _0_1.GET && {
        source     : "src/api/metrics.ts?fn=GET",
        method     : "get",
        route      : "/metrics",
        path       : "/api/metrics",
        url        : "/api/metrics",
        cb         : _0_1.GET,
      },
  _0_1.PUT && {
        source     : "src/api/metrics.ts?fn=PUT",
        method     : "put",
        route      : "/metrics",
        path       : "/api/metrics",
        url        : "/api/metrics",
        cb         : _0_1.PUT,
      },
  _0_1.POST && {
        source     : "src/api/metrics.ts?fn=POST",
        method     : "post",
        route      : "/metrics",
        path       : "/api/metrics",
        url        : "/api/metrics",
        cb         : _0_1.POST,
      },
  _0_1.PATCH && {
        source     : "src/api/metrics.ts?fn=PATCH",
        method     : "patch",
        route      : "/metrics",
        path       : "/api/metrics",
        url        : "/api/metrics",
        cb         : _0_1.PATCH,
      },
  _0_1.DELETE && {
        source     : "src/api/metrics.ts?fn=DELETE",
        method     : "delete",
        route      : "/metrics",
        path       : "/api/metrics",
        url        : "/api/metrics",
        cb         : _0_1.DELETE,
      },
  _0_2.default && {
        source     : "src/api/readyz.ts?fn=default",
        method     : "use",
        route      : "/readyz",
        path       : "/api/readyz",
        url        : "/api/readyz",
        cb         : _0_2.default,
      },
  _0_2.GET && {
        source     : "src/api/readyz.ts?fn=GET",
        method     : "get",
        route      : "/readyz",
        path       : "/api/readyz",
        url        : "/api/readyz",
        cb         : _0_2.GET,
      },
  _0_2.PUT && {
        source     : "src/api/readyz.ts?fn=PUT",
        method     : "put",
        route      : "/readyz",
        path       : "/api/readyz",
        url        : "/api/readyz",
        cb         : _0_2.PUT,
      },
  _0_2.POST && {
        source     : "src/api/readyz.ts?fn=POST",
        method     : "post",
        route      : "/readyz",
        path       : "/api/readyz",
        url        : "/api/readyz",
        cb         : _0_2.POST,
      },
  _0_2.PATCH && {
        source     : "src/api/readyz.ts?fn=PATCH",
        method     : "patch",
        route      : "/readyz",
        path       : "/api/readyz",
        url        : "/api/readyz",
        cb         : _0_2.PATCH,
      },
  _0_2.DELETE && {
        source     : "src/api/readyz.ts?fn=DELETE",
        method     : "delete",
        route      : "/readyz",
        path       : "/api/readyz",
        url        : "/api/readyz",
        cb         : _0_2.DELETE,
      }
].filter(it => it);

export const routers = internal.map((it) => { 
  const { method, path, route, url, source} = it;
  return { method, url, path, route, source };
});

export const endpoints = internal.map((it) => it.method?.toUpperCase() + '\t' + it.url);

const FN = (value) => value;

export const applyRouters = (applyRouter, opts = {} ) => {
  const {pre = FN, post = FN, hoc = FN} = opts;
  pre(internal)
    .forEach((it) => {
    it.cb = hoc(it.cb, it);
    applyRouter(it);
  });  
  post(internal);
};
