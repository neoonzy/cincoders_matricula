"""Smoke E2E opcional, após `npm run dev` com banco e dependências configurados.
Requer Python com Playwright e navegador Chromium disponível.
Executa em http://127.0.0.1:5173 (não altera dados de cadastro).
"""
from playwright.sync_api import sync_playwright
BASE='http://127.0.0.1:5173'
with sync_playwright() as playwright:
    browser=playwright.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
    page=browser.new_page(viewport={'width':360,'height':780},device_scale_factor=1)
    page.goto(BASE+'/login')
    page.get_by_label('Nome de usuário').fill('ana.si')
    page.get_by_label('Senha', exact=True).fill('Teste@2026')
    page.get_by_role('button', name='Entrar no portal').click()
    page.get_by_role('heading',name='Encontre sua próxima disciplina.').wait_for()
    page.get_by_role('heading',name='Estruturas de Dados').first.wait_for()
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'), 'Overflow horizontal em ofertas'
    page.goto(BASE+'/aluno/planejamento')
    page.get_by_role('heading',name='Planeje antes de decidir.').wait_for()
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'), 'Overflow horizontal em planejamento'
    page.goto(BASE+'/aluno/progresso')
    page.get_by_role('heading',name='Seu progresso, com clareza.').wait_for()
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'), 'Overflow horizontal em progresso'
    browser.close()
print('Smoke E2E 360px aprovado')
