import Link from 'next/link';
import githubIcon from './icon/github.svg';

const maskStyle: React.CSSProperties = {
  display: 'inline-block',
  width: 20,
  height: 20,
  backgroundColor: 'currentColor',
  maskImage: `url(${githubIcon.src})`,
  WebkitMaskImage: `url(${githubIcon.src})`,
  maskSize: 'contain',
  WebkitMaskSize: 'contain',
  maskRepeat: 'no-repeat',
  WebkitMaskRepeat: 'no-repeat',
  maskPosition: 'center',
  WebkitMaskPosition: 'center',
};

export default function Footer() {
  return (
    <footer style={styles.footer}>
      <div style={styles.right}>
        <a
          href="https://github.com/Yoila7"
          target="_blank"
          rel="noopener noreferrer"
          style={styles.iconBtn}
          title="Github个人主页"
        >
          <span style={maskStyle} />
        </a>
        <Link href="/about" style={styles.textBtn}>
          关于我
        </Link>
      </div>
    </footer>
  );
}

const styles: Record<string, React.CSSProperties> = {
  footer: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'var(--bg)',
    display: 'flex',
    justifyContent: 'flex-end',
    padding: '0.75rem 5%',
    borderTop: '1px solid var(--border-color, #ccc)',
  },
  right: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
  },
  iconBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    background: 'none',
    border: '1px solid var(--border-color, #ccc)',
    borderRadius: '6px',
    padding: '4px',
    cursor: 'pointer',
    textDecoration: 'none',
    color: 'inherit',
  },
  textBtn: {
    textDecoration: 'underline',
    color: 'inherit',
    fontWeight: 500,
  },
};
