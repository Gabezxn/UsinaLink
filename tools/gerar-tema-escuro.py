#!/usr/bin/env python3
"""Gera Site/assets/css/tema-escuro.css a partir do style.css.

Cada regra do style.css que tem cor vira uma regra "html.a11y-dark <seletor>" com as cores trocadas por
versões escuras (azul-marinho, no mesmo clima da imagem de compartilhamento). Só as declarações de cor
são copiadas. Rode de novo sempre que o style.css mudar:  python tools/gerar-tema-escuro.py
"""
import colorsys, re, sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
ENTRADA = RAIZ / 'Site' / 'style.css'
SAIDA = RAIZ / 'Site' / 'assets' / 'css' / 'tema-escuro.css'
MATIZ_BASE = 222  # azul-marinho

# ---------- cores ----------
NOMES = {'white': (255, 255, 255, 1), 'black': (0, 0, 0, 1)}
RE_COR = re.compile(r'#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3,4}\b|rgba?\([^)]*\)|hsla?\([^)]*\)|\b(?:white|black)\b')


def parse(tok):
    t = tok.strip().lower()
    if t in NOMES:
        return NOMES[t]
    if t.startswith('#'):
        h = t[1:]
        if len(h) in (3, 4):
            h = ''.join(c * 2 for c in h)
        r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
        a = int(h[6:8], 16) / 255 if len(h) == 8 else 1
        return r, g, b, a
    m = re.match(r'(rgba?|hsla?)\((.*)\)', t)
    if not m:
        return None
    partes = [p for p in re.split(r'[\s,/]+', m.group(2).strip()) if p]
    def num(p, escala=1.0):
        return float(p[:-1]) / 100 * escala if p.endswith('%') else float(p)
    if m.group(1).startswith('rgb'):
        r, g, b = (num(p, 255) for p in partes[:3])
        a = num(partes[3]) if len(partes) > 3 else 1
        return r, g, b, a
    h = float(partes[0].replace('deg', '')) / 360
    s, l = num(partes[1]), num(partes[2])
    a = num(partes[3]) if len(partes) > 3 else 1
    r, g, b = colorsys.hls_to_rgb(h, l, s)
    return r * 255, g * 255, b * 255, a


def para_hls(r, g, b):
    h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
    return h * 360, s, l


def emitir(h, s, l, a):
    s = max(0, min(1, s)); l = max(0, min(1, l))
    r, g, b = colorsys.hls_to_rgb((h % 360) / 360, l, s)
    r, g, b = (round(x * 255) for x in (r, g, b))
    if a >= 0.999:
        return '#%02x%02x%02x' % (r, g, b)
    return 'rgba(%d, %d, %d, %s)' % (r, g, b, ('%.3f' % a).rstrip('0').rstrip('.'))


def fundo(h, s, l, a):
    if l >= 0.8:  # claro: vira azul-marinho; branco (cartão) fica mais claro que o fundo da página (.98)
        t = (l - 0.8) / 0.2
        nl = 0.065 + 0.08 * (t ** 6)
        if s < 0.15:
            return MATIZ_BASE, 0.62, nl
        if 195 <= h <= 260:  # azulados e cinza-azulados viram azul-marinho de verdade
            return MATIZ_BASE, 0.62, nl
        return h, min(s, 0.55), nl
    if l >= 0.5:
        if s < 0.3:
            return MATIZ_BASE, 0.3, 0.26
        return h, s, l  # realces (laranja, azul médio): ficam
    if l < 0.2:
        return h, s, l  # já é escuro
    if s < 0.3:
        return h, s, l
    return h, s, min(l + 0.12, 0.52)  # azul da marca: um pouco mais vivo


def texto(h, s, l, a):
    if l >= 0.88:
        return h, s, l  # texto branco em botão colorido continua branco
    if s < 0.3:
        return (h if s > 0.08 else MATIZ_BASE), min(s, 0.4), 0.98 - 0.58 * l
    return h, min(s, 0.85), max(l, 0.70)


def borda(h, s, l, a):
    if l >= 0.7:
        return (h if s > 0.15 else MATIZ_BASE), min(s, 0.4), 0.33 - (l - 0.7) * 0.4
    if l < 0.2 or s < 0.3:
        return h, s, l
    return h, s, min(l + 0.12, 0.6)


def trocar_cores(valor, papel):
    def uma(m):
        c = parse(m.group(0))
        if c is None:
            return m.group(0)
        r, g, b, a = c
        if a == 0:
            return m.group(0)
        h, s, l = para_hls(r, g, b)
        h, s, l = {'texto': texto, 'fundo': fundo, 'borda': borda}[papel](h, s, l, a)
        return emitir(h, s, l, a)
    return RE_COR.sub(uma, valor)


ABREVIACOES = {'border', 'border-top', 'border-right', 'border-bottom', 'border-left', 'background', 'outline'}


def papel_da_propriedade(p):
    p = p.lower()
    if p.startswith('--'):
        if re.search(r'text|fg|ink|color', p):
            return 'texto'
        if re.search(r'border|line', p):
            return 'borda'
        return 'fundo'
    if p in ('color', 'fill', 'stroke', 'caret-color', 'text-decoration-color', '-webkit-text-fill-color'):
        return 'texto'
    if p.startswith('background'):
        return 'fundo'
    if p.startswith('border') or p.startswith('outline') or p == 'column-rule':
        return 'borda'
    return None


# ---------- leitura do CSS ----------
def sem_comentarios(css):
    return re.sub(r'/\*.*?\*/', '', css, flags=re.S)


def blocos(css):
    """Devolve [(prelude, corpo)] no nível atual; corpo é o texto entre as chaves."""
    saida, i, n = [], 0, len(css)
    while i < n:
        j = css.find('{', i)
        if j < 0:
            break
        prelude = css[i:j].strip()
        prof, k = 1, j + 1
        while k < n and prof:
            c = css[k]
            if c == '{': prof += 1
            elif c == '}': prof -= 1
            k += 1
        saida.append((prelude, css[j + 1:k - 1]))
        i = k
    return saida


def declaracoes(corpo):
    partes, atual, par, asp = [], '', 0, None
    for c in corpo:
        if asp:
            atual += c
            if c == asp: asp = None
            continue
        if c in '"\'':
            asp = c; atual += c; continue
        if c == '(': par += 1
        elif c == ')': par -= 1
        if c == ';' and par == 0:
            partes.append(atual); atual = ''
        else:
            atual += c
    if atual.strip():
        partes.append(atual)
    out = []
    for p in partes:
        if ':' not in p:
            continue
        nome, valor = p.split(':', 1)
        out.append((nome.strip(), valor.strip()))
    return out


def prefixar(seletor):
    s = seletor.strip()
    if not s or 'a11y' in s or s.startswith(('*', ':root')):
        return None
    if s == 'html':
        return 'html.a11y-dark'
    if s.startswith('html '):
        return 'html.a11y-dark ' + s[5:]
    return 'html.a11y-dark ' + s


def regras(css, nivel=0):
    saida = []
    for prelude, corpo in blocos(css):
        if prelude.startswith('@'):
            nome = prelude.split()[0].lower()
            if nome in ('@media', '@supports'):
                interno = regras(corpo, nivel + 1)
                if interno:
                    saida.append(f'{prelude} {{\n' + ''.join('  ' + l + '\n' if l else '\n' for r in interno for l in r.split('\n')).rstrip() + '\n}')
            continue  # @keyframes, @font-face, @import: ignorados
        seletores = [prefixar(s) for s in re.split(r',(?![^(]*\))', prelude)]
        seletores = [s for s in seletores if s]
        if not seletores:
            continue
        decls = []
        for nome, valor in declaracoes(corpo):
            papel = papel_da_propriedade(nome)
            if not papel:
                continue
            if not RE_COR.search(valor):
                # "border: 0", "background: transparent" etc. precisam ser copiados: senão a versão escura de outra regra
                # (com cor) ganharia deles e a caixa voltaria a ter borda/fundo.
                if nome.lower() in ABREVIACOES:
                    decls.append(f'  {nome}: {valor};')
                continue
            novo = trocar_cores(valor, papel)
            if novo != valor:
                decls.append(f'  {nome}: {novo};')
        if decls:
            saida.append(',\n'.join(seletores) + ' {\n' + '\n'.join(decls) + '\n}')
    return saida


CABECALHO = '''/* GERADO por tools/gerar-tema-escuro.py a partir do style.css. Não edite à mão: rode o script de novo.
   Modo escuro de verdade (azul-marinho, no clima da imagem de compartilhamento), no lugar da inversão de cores. */

html.a11y-dark {
  color-scheme: dark;
  filter: none;
  background: #0b1630;
  --blue: #5b8cff;
  --orange-text: #ffa24d;
  --text: #e8eefc;
  --muted: #9fb0d4;
  --bg: #0b1630;
  --border: #25365f;
  --card: #111f40;
  --shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
  --soft-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  --gradient: linear-gradient(135deg, #3d6bea, #2f55c4);
  --primary-dark: #8fb0ff;
  --primary: #5b8cff;
  --secondary: #b794f6;
  --background: #0b1630;
  --surface: #111f40;
  --text-primary: #e8eefc;
  --text-secondary: #a9b8d8;
  --border-soft: #25365f;
}
html.a11y-dark body { color: var(--text); }
html.a11y-dark ::placeholder { color: #7f91b8; }
html.a11y-dark select option { background: #111f40; color: #e8eefc; }

'''


RODAPE = '''/* Logo: no escuro a marca vira o quadrado branco com o símbolo azul-marinho (como na imagem de compartilhamento) */
html.a11y-dark .brand-icon { background: #ffffff !important; box-shadow: none; }
html.a11y-dark .brand-icon .brand-mark { content: url("../img/logo-mark.svg"); }

/* Avisos (toast): no tema claro usavam a cor do texto como fundo; no escuro essa cor é clara e o texto branco sumia */
html.a11y-dark .toast { background: #1d3270; color: #ffffff; border: 1px solid #3a5199; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45); }

/* Faixa azul "Tem uma peça para cotar?": os botões continuam claros sobre o azul */
html.a11y-dark .lp-cta .lp-btn-light { background: #ffffff; color: #1e3a8a; border-color: #ffffff; }
html.a11y-dark .lp-cta .lp-btn-outline { background: transparent; color: #ffffff; border: 2px solid rgba(255, 255, 255, 0.75); }
'''


def principal():
    css = sem_comentarios(ENTRADA.read_text(encoding='utf-8'))
    corpo = '\n\n'.join(regras(css))
    SAIDA.write_text(CABECALHO + corpo + '\n\n' + RODAPE, encoding='utf-8', newline='\n')
    print(f'{SAIDA.relative_to(RAIZ)}: {len(corpo.splitlines())} linhas de regras')


if __name__ == '__main__':
    sys.exit(principal())
