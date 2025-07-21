import subprocess
import sys

# Comando para iniciar o backend com debug (usando tsx e Node.js)
backend_cmd = [
    'npx', 'tsx', '--inspect', 'src/index.ts'
]

print('Iniciando SIGATA backend com debug...')
proc = subprocess.Popen(backend_cmd, shell=True)

try:
    proc.wait()
except KeyboardInterrupt:
    print('Encerrando backend...')
    proc.terminate()
    sys.exit(0)
