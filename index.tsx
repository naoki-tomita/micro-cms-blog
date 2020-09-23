import React, { FC, useEffect, useState } from "react";
import { render } from "react-dom";
import "object-extention";
import logo from "url:./logo.png";

function fetchCms(path: string) {
  return fetch(`https://blog123.microcms.io/api/v1${path}`, { headers: {"x-api-key": "28f43798-9e62-4696-8c22-f0a7890f8974"} })
}

const Header: FC = () => {
  return (
    <header style={{ background: `url(${logo})`, display: "block", height: 220, ...{"&:hover": { filter: "none" }} }}>
      <Link href="/entries" style={{ height: "100%", width: "100%" }} ></Link>
    </header>
  );
}

const Entry: FC<{ id: string }> = ({ id }) => {
  const [entry, setEntry] = useState<{
    id: string;
    title: string;
    body: string;
  } | null>(null);
  useEffect(() => {
    fetchCms(`/entries/${id}`)
      .then(it => it.json())
      .then(it => (setEntry(it)));
  }, [id]);
  return (
    <>
    <Header />
    <main>
      <div ref={(ref) => (entry && ref && (ref.innerHTML = entry.body.replace(/<img(.+?)>/g, "<figure><img $1></figure>")))}>loading</div>
    </main>
    <footer>@kojiro.ueda</footer>
    </>
  );
}

const Entries: FC = () => {
  const [entries, setEntries] = useState<Array<{
    id: string;
    title: string;
    body: string;
  }>>([]);
  useEffect(() => {
    fetchCms("/entries")
      .then(it => it.json())
      .then(it => setEntries(it.contents));
  }, []);
  return (
    <>
    <Header />
    <main>
      <ul>
        {entries.map(it => <li key={it.id}><Link href={`/entries/${it.id}`}>{it.title}</Link></li>)}
      </ul>
    </main>
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
