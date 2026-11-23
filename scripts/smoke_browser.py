"""E2E com PostgreSQL de testes, API e Vite em execução.

Execute somente com dados fictícios; realiza matrícula e cancelamento.
Requer pip install playwright && python -m playwright install chromium.
"""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = os.environ.get('BASE_URL', 'http://127.0.0.1:5173')
IMAGES = Path('test-results')
IMAGES.mkdir(exist_ok=True)


def ensure_no_overflow(page, where):
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'), (
        f'Overflow horizontal em {where}: {page.evaluate("document.documentElement.scrollWidth")}px'
    )


def login(page, username):
    page.goto(BASE + '/login', wait_until='domcontentloaded')
    page.get_by_role('heading', name='Entrar no sistema.').wait_for()
    page.locator('.cin-logo').wait_for()
    assert page.locator('.cin-logo').evaluate('(img) => img.complete && img.naturalWidth > 0'), 'Marca institucional não carregou'
    ensure_no_overflow(page, f'login {page.viewport_size["width"]}px')
    page.screenshot(path=str(IMAGES / f'login-{page.viewport_size["width"]}.png'), full_page=True)
    page.get_by_label('Nome de usuário').fill(username)
    page.get_by_label('Senha', exact=True).fill('Teste@2026')
    page.get_by_role('button', name='Entrar no portal').click()


with sync_playwright() as playwright:
    kwargs = {'headless': True}
    if os.environ.get('CHROMIUM_PATH'):
        kwargs['executable_path'] = os.environ['CHROMIUM_PATH']
    browser = playwright.chromium.launch(**kwargs)
    errors = []

    mobile = browser.new_context(viewport={'width': 360, 'height': 780}, device_scale_factor=1)
    student = mobile.new_page()
    student.set_default_timeout(20000)
    student.on('pageerror', lambda exception: errors.append(str(exception)))
    login(student, 'ana.si')
    student.get_by_role('heading', name='Ofertas de disciplinas', exact=True).wait_for()
    student.get_by_role('heading', name='Estruturas de Dados').first.wait_for()
    ensure_no_overflow(student, 'ofertas 360px')
    student.screenshot(path=str(IMAGES / 'aluno-ofertas-360.png'), full_page=True)

    offer = student.locator('.offer-card').filter(has_text='Estruturas de Dados').first
    offer.get_by_role('button', name='Adicionar ao plano').click()
    offer.get_by_role('button', name='No planejamento').wait_for()
    student.get_by_role('navigation', name='Navegação principal').get_by_role('link', name='Planejamento', exact=True).click()
    student.get_by_role('heading', name='Planejamento curricular', exact=True).wait_for()
    student.get_by_text('CH viável no plano:').wait_for()
    ensure_no_overflow(student, 'planejamento 360px')
    student.screenshot(path=str(IMAGES / 'aluno-planejamento-360.png'), full_page=True)

    student.locator('.offer-card').filter(has_text='Estruturas de Dados').get_by_role('button', name='Matricular-se').click()
    student.get_by_text('Matrícula efetivada. Essa turma saiu do seu planejamento.').wait_for()
    student.goto(BASE + '/aluno/matriculas')
    student.get_by_role('heading', name='Minhas matrículas', exact=True).wait_for()
    student.locator('.enrollment-item').filter(has_text='Estruturas de Dados').wait_for()
    student.once('dialog', lambda dialog: dialog.accept())
    student.locator('.enrollment-item').filter(has_text='Estruturas de Dados').get_by_role('button', name='Cancelar').click()
    student.get_by_text('Matrícula cancelada. A vaga foi liberada.').wait_for()
    student.get_by_role('heading', name='Nenhuma matrícula ativa').wait_for()
    ensure_no_overflow(student, 'matrículas 360px')
    student.goto(BASE + '/aluno/progresso')
    student.get_by_role('heading', name='Progresso acadêmico', exact=True).wait_for()
    ensure_no_overflow(student, 'progresso 360px')
    student.screenshot(path=str(IMAGES / 'aluno-progresso-360.png'), full_page=True)
    assert student.locator('.app-frame').get_attribute('data-persona') == 'student'
    assert student.get_by_role('navigation', name='Navegação principal').evaluate('(el) => getComputedStyle(el).position') == 'fixed'

    desktop = browser.new_context(viewport={'width': 1280, 'height': 800})
    secretary = desktop.new_page()
    secretary.set_default_timeout(20000)
    secretary.on('pageerror', lambda exception: errors.append(str(exception)))
    login(secretary, 'secretaria')
    secretary.get_by_role('heading', name='Disciplinas', exact=True).wait_for()
    ensure_no_overflow(secretary, 'secretaria disciplinas 1280px')
    assert secretary.locator('.app-frame').get_attribute('data-persona') == 'secretary'
    secretary.screenshot(path=str(IMAGES / 'secretaria-disciplinas-1280.png'), full_page=True)
    secretary.get_by_role('navigation', name='Navegação principal').get_by_role('link', name='Turmas', exact=True).click()
    secretary.get_by_role('heading', name='Turmas', exact=True).wait_for()
    secretary.get_by_role('button', name='Abrir turma').click()
    secretary.get_by_role('heading', name='Abrir nova turma').wait_for()
    secretary.get_by_role('button', name='Fechar formulário').click()
    secretary.screenshot(path=str(IMAGES / 'secretaria-turmas-1280.png'), full_page=True)

    assert not errors, 'Erros de execução JavaScript: ' + '; '.join(errors)
    mobile.close()
    desktop.close()
    browser.close()

print('Smoke E2E aprovado: aluno 360px (planejamento, matrícula, cancelamento e progresso) e secretaria 1280px.')
