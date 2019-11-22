#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const WordTable = require('word-table');
const yParser = require('yargs-parser');
const inquirer = require('inquirer');
const templateJsonPath = path.join(__dirname, '../template.json');
const log = console.log;
const script = process.argv[2] || 'help'; // help,set,clear,list,g
const args = yParser(process.argv.slice(3));
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
];
switch (script) {
    case 'help':
        listHelp();
        break;
    case 'list':
        listConfig();
        break;
    case 'set':
        setPath(args);
        break;
    case 'clear':
        clearPath(args);
        break;
    case 'g':
        generate(args);
        break;
    default:
}
/**
 * generate template
 * @param name name of template
 */
function generate({ name = '', target = '', f }) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!name) {
            log(chalk.red('请指定模板名称！'));
            return;
        }
        const templateJson = getTemplateJson();
        const source = templateJson[name];
        const targetPath = target && `./${target}` || './' + source.split('/').pop();
        if (fs.existsSync(targetPath) && !f) {
            const answers = yield inquirer.prompt([
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
            ]);
            if (answers.confirm) {
                copyTemplate(source, targetPath);
            }
        }
        else {
            copyTemplate(source, targetPath);
        }
    });
}
/**
 * clear template path.
 * @param name name of template
 */
function clearPath({ name = '' }) {
    if (!name) {
        log(chalk.red('请指定模板名称'));
        return;
    }
    const templateJson = getTemplateJson();
    delete templateJson[name];
    fs.writeFileSync(templateJsonPath, JSON.stringify(templateJson));
    log(chalk.green('清除成功'));
}
/**
 * list template-path config on Terminal.
 */
function listConfig() {
    const templateJson = getTemplateJson();
    const header = ['模板名称', '模板路径'];
    const body = Object.keys(templateJson).map(k => ([k, templateJson[k]]));
    const wt = new WordTable(header, body);
    log('\n' + chalk.green(wt.string()) + '\n');
}
/**
 * set path of one template files.
 * @param name name of template
 */
function setPath({ name, path }) {
    if (!name || !path) {
        log(chalk.red('请指定模板名称或模板文件路径！'));
        return;
    }
    if (!fs.existsSync(path)) {
        log(chalk.red('模板文件路径不存在，请检查！'));
        return;
    }
    const templateJson = getTemplateJson();
    templateJson[name] = path.endsWith('/') ? path.slice(0, -1) : path;
    fs.writeFileSync(templateJsonPath, JSON.stringify(templateJson));
    log(chalk.green('设置成功！'));
}
function getTemplateJson() {
    const templateJsonBuffer = fs.readFileSync(templateJsonPath, {
        flag: 'a+'
    });
    return templateJsonBuffer.toString() ? JSON.parse(templateJsonBuffer.toString()) : {};
}
/**
 * copy template
 * @param source source file/dir
 * @param target target file/dir
 */
function copyTemplate(source, target) {
    try {
        const stats = fs.statSync(source);
        if (stats.isFile()) {
            fs.copyFileSync(source, target);
        }
        else {
            copyDir(source, target);
        }
        log(chalk.green('复制模板成功'));
    }
    catch (error) {
        log(chalk.red('复制模板失败：' + error.message));
    }
}
function copyDir(source, target) {
    try {
        fs.mkdirSync(target);
    }
    catch (error) {
        if (!error.message.startsWith('EEXIST: file already exists'))
            throw error;
    }
    const files = fs.readdirSync(source);
    files.forEach((p) => {
        fs.copyFileSync(source + '/' + p, target + '/' + p);
    });
}
// list usage of all commands
function listHelp() {
    console.log(`\n  Usage: mpages <command> [options]\n`);
    console.log(`  Commands:\n`);
    for (const command of commands) {
        console.log(`    ${chalk.green(padEnd(command.name, 7))}${command.description || ''}`);
    }
    console.log('\n');
}
function padEnd(s, l) {
    return s + ' '.repeat(l - s.length);
}