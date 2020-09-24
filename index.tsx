import React, { FC, useEffect, useState } from "react";
import { render } from "react-dom";
import "object-extention";
import logo from "url:./logo.png";

function fetchCms(path: string) {
  return fetch(`https://blog123.microcms.io/api/v1${path}`, { headers: {"x-api-key": "28f43798-9e62-4696-8c22-f0a7890f8974"} })
}

const Header: FC = () => {
  return (
    <header style={{ background: `url(${logo}) center no-repeat`, display: "block", height: 220, ...{"&:hover": { filter: "none" }} }}>
      <Link href="/entries" style={{ height: "100%", width: "100%" }} ></Link>
    </header>
  );
}

interface Entry {
  id: string;
  title: string;
  body: string;
  publishedAt: Date;
}


const Entry: FC<{ id: string }> = ({ id }) => {
  const [entry, setEntry] = useState<Entry | null>(null);
  useEffect(() => {
    fetchCms(`/entries/${id}`)
      .then(it => it.json())
      .then(it => (setEntry(it.let(it => ({ ...it, publishedAt: new Date(it.publishedAt) })))));
  }, [id]);
  return (
    <>
    <Header />
    <main>
      <section>
        <h1>{entry?.title ?? "loading..."}</h1>
      </section>
      {/* microCMSはリッチテキストをhtmlで返してくるので、refで埋め込む。
          また、mvp.cssはimgをfigureで挟むことを想定しているので、いい感じに置き換えるようにしている。 */}
      <div ref={(ref) => (entry && ref && (ref.innerHTML = entry.body.replace(/<img(.+?)>/g, "<figure><img $1></figure>")))}>loading</div>
    </main>
    <footer>@kojiro.ueda</footer>
    </>
  );
}

const Entries: FC = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  useEffect(() => {
    fetchCms("/entries")
      .then(it => it.json())
      .then(({ contents }: { contents: Entry[] }) =>
        setEntries(contents.map(it => ({ ...it, publishedAt: new Date(it.publishedAt) }))));
  }, []);
  return (
    <>
    <Header />
    <main>
      <section>
        {entries.map(it =>
          <aside key={it.id}>
            <h3>
              <Link href={`/entries/${it.id}`}>{it.title}</Link>
            </h3>
            <p><small>{it.publishedAt.toDateString()}</small></p>
          </aside>)}
      </section>
    </main>
    <footer>@kojiro.ueda</footer>
    </>
  );
}

const App: FC = () => {
  const { Router } = useRouter([
    {
      path: "/entries",
      Component: Entries
    },
    {
      path: "/entries/:id",
      Component: Entry
    }
  ]);
  return (
    <>
    <Router />
    </>
  );
};

interface Route {
  path: string;
  Component: FC;
}

interface Router {
  href(path: string): void;
  reload(): void;
  path: string;
  Router: FC;
}

function matchPath(path: string, expectedPath: string): boolean {
  const paths = path.split("/");
  const expectedPaths = expectedPath.split("/");
  if (paths.length !== expectedPaths.length) {
    return false;
  }
  for (const i in paths) {
    if (expectedPaths[i].startsWith(":")) {
      continue;
    } else if (paths[i] !== expectedPaths[i]) {
      return false;
    }
  }
  return true;
}

function getProps(path: string, expectedPath: string): any {
  const paths = path.split("/");
  const expectedPaths = expectedPath.split("/");
  const result = {};
  for (const i in paths) {
    if (expectedPaths[i].startsWith(":")) {
      result[expectedPaths[i].substring(1)] = paths[i];
    }
  }
  return result;
}

const Link: FC<{ href: string; style?: React.CSSProperties }> = ({ href, children, style }) => {
  return (
    <a href={`#${href}`} style={style}>{children}</a>
  );
}

function useRouter(routes: Route[]): Router {
  const [path, setPath] = useState(location.hash.substring(1));
  useEffect(() => {
    window.onhashchange = () => setPath(location.hash.substring(1));
    setPath(location.hash.substring(1));
  }, []);
  useEffect(() => {location.hash = path}, [path]);

  return {
    href(path) {
      setPath(path);
    },
    reload() {
      location.reload();
    },
    path,
    Router: (props) => {
      return (
        <div {...props} >
          {routes.find(it => matchPath(path, it.path))?.let(({ Component, path: epath }) => <Component {...getProps(path, epath)} />) ?? "not found"}
        </div>
      );
    },
  };
}

render(<App/>, document.getElementById("app"))
