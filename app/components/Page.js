export default function Page({ style, hello, title }) {
  return (
    <div style={style}>
      {title} {hello && "Hello world!"}
    </div>
  );
}
