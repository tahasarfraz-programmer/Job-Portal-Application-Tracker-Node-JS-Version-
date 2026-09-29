import { Link } from 'react-router-dom';

const Page = ({ code, title, text }) => (
  <div className="mx-auto max-w-md px-4 py-24 text-center">
    <p className="font-display text-6xl font-extrabold text-teal">{code}</p>
    <h1 className="mt-2 text-2xl font-bold">{title}</h1>
    <p className="mt-2 text-ink/70">{text}</p>
    <Link to="/" className="btn mt-6">Back to home</Link>
  </div>
);

export const NotFound = () => <Page code="404" title="Page not found" text="The page you are looking for has moved or does not exist." />;
export const Forbidden = () => <Page code="403" title="You can't open this page" text="Your account role does not have access to this area." />;
