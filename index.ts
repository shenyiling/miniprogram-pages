#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import inquirer from 'inquirer'
import WordTable from 'word-table'
import Parser from 'yargs-parser'
import home from 'user-home'
import ncp from 'ncp'

const templatePath = path.join(home, '.mpages_tmp.json')
const log = console.log

const script = process.argv[2] || 'help' // help,set,clear,list,g
const args = Parser(process.argv.slice(3)) as IArgs

const commands = [
    {
        name: 'help',
        description: 'log usage of all commands'
    },
    {
        name: 'set',
        description: 'set template path'
    },
    {
        name: 'clear',
        description: 'clear template path'
    },
    {
        name: 'g',
        description: 'generate template'
    },
    {
        name: 'list',
        description: 'log template-path config'
    },
]

switch (script) {
    case 'help':
        listHelp()
        break
    case 'list':
        listConfig()
        break
    case 'set':
        setPath(args)
        break
    case 'clear':
        clearPath(args)
        break
    case 'g':
        generate(args)
        break
    default:
}

/**
 * generate template
 * @param name name of template
 */
async function generate({
    name = '',
    target = '',
    f
}: IArgs) {
    if (!name) {
        log(chalk.red('请指定模板名称！'))
        return
    }
    const templateJson = getTemplateJson()
    const source = templateJson[ name ]
    if (!source || !fs.existsSync(source)) {
        log(chalk.red('模板名称或模板路径不存在！'))
        return
    }
    const targetPath = target || '.' 
    if (fs.existsSync(targetPath) && !f) {
        const answers = await inquirer.prompt([
            {
                name: 'confirm',
                message: '当前目录下已存在相同名称文件，是否强制覆盖？',
                type: 'list',
                choices: [
                    {
                        name: 'yes',
                        value: true
                    },
                    {
                        name: 'no',
                        value: false      
                    },
                ]
            },
        ])
        if (answers.confirm) {
            copyTemplate(source, targetPath)
        }
    } else {
        copyTemplate(source, targetPath)
    }
}

/**
 * clear template path.
 * @param name name of template
 */
function clearPath({
    name = ''
}: IArgs) {
    if (!name) {
        log(chalk.red('请指定模板名称'))
        return
    }
    const templateJson = getTemplateJson()
    delete templateJson[ name ]
    fs.writeFileSync(templatePath, JSON.stringify(templateJson))
    log(chalk.green('清除成功'))
}

/**
 * list template-path config on Terminal.
 */
function listConfig() {
    const templateJson = getTemplateJson()
    const header = [ '模板名称', '模板路径' ]
    const body = Object.keys(templateJson).map(k => ([ k, templateJson[ k ] ]))
    const wt = new WordTable(header, body)
    log('\n' + chalk.green(wt.string()) + '\n')
}

/**
 * set path of one template files.
 * @param name name of template
 */
function setPath({
    name,
    path
}: IArgs) {
    if (!name || !path) {
        log(chalk.red('请指定模板名称或模板文件路径！'))
        return
    }
    if (!fs.existsSync(path)) {
        log(chalk.red('模板文件路径不存在，请检查！'))
        return
    }
    const templateJson = getTemplateJson()
    templateJson[ name ] = path.endsWith('/') ? path.slice(0, -1) : path
    fs.writeFileSync(templatePath, JSON.stringify(templateJson))
    log(chalk.green('设置成功！'))
}

function getTemplateJson() {
    if (!fs.existsSync(templatePath)) {
        fs.writeFileSync(templatePath, '')
    }
    const templateJsonBuffer = fs.readFileSync(templatePath, {
        flag: 'a+'
    })
    return templateJsonBuffer.toString() ? JSON.parse(templateJsonBuffer.toString()) : {}
}

/**
 * copy template
 * @param source source file/dir
 * @param target target file/dir
 */
function copyTemplate(source: string, target: string) {
    ncp(source, target, err => {
        if (err) {
            log(chalk.red('复制模板失败：' + err[0].message))
        } else {
            log(chalk.green('复制模板成功'))
        }
    })
}

// function copyDir(source: string, target: string) {
//     try {
//         fs.mkdirSync(target)
//     } catch (error) {
//         if (!error.message.startsWith('EEXIST: file already exists')) throw error
//     }
//     const files = fs.readdirSync(source)
//     files.forEach((p: string) => {
//         fs.copyFileSync(source + '/' + p, target + '/' + p)
//     })
// }

// list usage of all commands
function listHelp() {
    log(`\n  Usage: mpages <command> [options]\n`);
    log(`  Commands:\n`);
    for (const command of commands) {
        log(`    ${chalk.green(padEnd(command.name, 7))}${command.description || ''}`);
    }
    log('\n')
}

function padEnd(s: string, l: number) {
    return s + ' '.repeat(l - s.length)
}

interface IArgs {
    name?: string,
    path?: string,
    target?: string,
    f?: boolean
}
