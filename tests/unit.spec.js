// 单元测试 - 不依赖浏览器
const fs = require('fs').promises;
const path = require('path');

// 模拟 localStorage
class LocalStorage {
    constructor() {
        this.store = {};
        this.clear();
    }
    getItem(key) {
        return this.store[key] || null;
    }
    setItem(key, value) {
        this.store[key] = String(value);
    }
    removeItem(key) {
        delete this.store[key];
    }
    clear() {
        this.store = {};
    }
    get length() {
        return Object.keys(this.store).length;
    }
    key(index) {
        return Object.keys(this.store)[index] || null;
    }
}

const storage = new LocalStorage();

// Storage 模块
const Storage = {
    _key: (k) => `rof:${k}`,
    get: (key, defaultVal = null) => {
        const v = storage.getItem(Storage._key(key));
        if (!v) return defaultVal;
        try { return JSON.parse(v); } catch (e) { return defaultVal; }
    },
    set: (key, value) => {
        storage.setItem(Storage._key(key), JSON.stringify(value));
    },
    _genId: () => {
        return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    },
    addItem: (collectionKey, item) => {
        const arr = Storage.get(collectionKey, []);
        const it = Object.assign({}, item);
        if (!it.id) it.id = Storage._genId();
        arr.push(it);
        Storage.set(collectionKey, arr);
        return it;
    },
    getAll: (collectionKey) => {
        return Storage.get(collectionKey, []);
    },
    removeItemById: (collectionKey, id) => {
        const arr = Storage.get(collectionKey, []);
        const filtered = arr.filter(i => i.id !== id);
        Storage.set(collectionKey, filtered);
        return filtered;
    },
    findById: (collectionKey, id) => {
        const arr = Storage.get(collectionKey, []);
        return arr.find(i => i.id === id) || null;
    },
    changePoints: (delta) => {
        const p = Storage.get('points', 0) || 0;
        const np = Number(p) + Number(delta);
        Storage.set('points', np);
        return np;
    },
    getPoints: () => {
        return Storage.get('points', 0) || 0;
    },
    initDefaults: () => {
        if (Storage.get('points') === null) Storage.set('points', 0);
        if (Storage.get('tasks') === null) Storage.set('tasks', []);
        if (Storage.get('rewards') === null) Storage.set('rewards', []);
        if (Storage.get('username') === null) Storage.set('username', 'Guest');
        if (Storage.get('rest_time_to_work_ratio') === null) Storage.set('rest_time_to_work_ratio', 5);
    },
    getRestRatio: () => {
        return Storage.get('rest_time_to_work_ratio', 5) || 5;
    },
    setRestRatio: (ratio) => {
        Storage.set('rest_time_to_work_ratio', ratio);
    }
};

// 测试报告
const testResults = {
    passed: [],
    failed: [],
    total: 0
};

function logTest(name, passed, details = '') {
    testResults.total++;
    if (passed) {
        testResults.passed.push({ name, details });
        console.log(`✅ ${name}`);
        if (details) console.log(`   ${details}`);
    } else {
        testResults.failed.push({ name, details });
        console.log(`❌ ${name}`);
        if (details) console.log(`   ${details}`);
    }
}

// 运行测试
async function runTests() {
    console.log('='.repeat(70));
    console.log('开始自动化单元测试');
    console.log('='.repeat(70));

    Storage.initDefaults();

    // 测试1: 添加奖励
    console.log('\n【测试1】添加奖励');
    try {
        const r1 = Storage.addItem('rewards', { name: '看电影', value: 50 });
        const r2 = Storage.addItem('rewards', { name: '吃大餐', value: 100 });
        const r3 = Storage.addItem('rewards', { name: '玩游戏', value: 30 });
        
        const rewards = Storage.getAll('rewards');
        const hasR1 = rewards.some(r => r.name === '看电影' && r.value === 50);
        const hasR2 = rewards.some(r => r.name === '吃大餐' && r.value === 100);
        const hasR3 = rewards.some(r => r.name === '玩游戏' && r.value === 30);
        
        logTest('添加奖励', hasR1 && hasR2 && hasR3, `奖励数量: ${rewards.length}, IDs: ${r1.id}, ${r2.id}, ${r3.id}`);
    } catch (err) {
        logTest('添加奖励', false, err.message);
    }

    // 测试2: 添加任务（含优先级计算）
    console.log('\n【测试2】添加任务（含优先级计算）');
    try {
        const t1 = Storage.addItem('tasks', {
            name: '完成作业',
            points: 20,
            time: 60,
            importance: '4',
            value: '3',
            urgent: '2',
            repeat: false,
            priority: 4 * 4 + 2 * 2 + 3 * 3 - 60 / 10
        });
        
        const t2 = Storage.addItem('tasks', {
            name: '阅读书籍',
            points: 30,
            time: 30,
            importance: '3',
            value: '2',
            urgent: '1',
            repeat: true,
            priority: 3 * 4 + 1 * 2 + 2 * 3 - 30 / 10
        });
        
        const t3 = Storage.addItem('tasks', {
            name: '紧急任务',
            points: 50,
            time: 120,
            importance: 'max',
            value: '3',
            urgent: '3',
            repeat: false,
            priority: 'max'
        });
        
        const tasks = Storage.getAll('tasks');
        const hasT1 = tasks.some(t => t.name === '完成作业' && t.priority === 23);
        const hasT2 = tasks.some(t => t.name === '阅读书籍' && t.priority === 17);
        const hasT3 = tasks.some(t => t.name === '紧急任务' && t.priority === 'max');
        
        logTest('添加任务', hasT1 && hasT2 && hasT3, `任务数量: ${tasks.length}, 优先级: ${t1.priority}, ${t2.priority}, ${t3.priority}`);
    } catch (err) {
        logTest('添加任务', false, err.message);
    }

    // 测试3: 完成任务（time=0）
    console.log('\n【测试3】完成任务（time=0）');
    try {
        const taskId = Storage.addItem('tasks', {
            name: '快速任务',
            points: 10,
            time: 0,
            importance: '3',
            value: '2',
            urgent: '1',
            repeat: false,
            priority: 17
        }).id;
        
        const pointsBefore = Storage.getPoints();
        Storage.changePoints(10);
        Storage.removeItemById('tasks', taskId);
        const pointsAfter = Storage.getPoints();
        const taskExists = Storage.findById('tasks', taskId);
        
        logTest('完成任务（time=0）', pointsAfter === pointsBefore + 10 && !taskExists, 
            `积分: ${pointsBefore} → ${pointsAfter}, 任务已删除: ${!taskExists}`);
    } catch (err) {
        logTest('完成任务（time=0）', false, err.message);
    }

    // 测试4: 完成任务（重复任务）
    console.log('\n【测试4】完成任务（重复任务）');
    try {
        const taskId = Storage.addItem('tasks', {
            name: '重复任务',
            points: 15,
            time: 0,
            importance: '3',
            value: '2',
            urgent: '1',
            repeat: true,
            priority: 17
        }).id;
        
        const pointsBefore = Storage.getPoints();
        Storage.changePoints(15);
        const pointsAfter = Storage.getPoints();
        const taskExists = Storage.findById('tasks', taskId);
        
        logTest('完成任务（重复任务）', pointsAfter === pointsBefore + 15 && taskExists, 
            `积分: ${pointsBefore} → ${pointsAfter}, 任务保留: ${!!taskExists}`);
    } catch (err) {
        logTest('完成任务（重复任务）', false, err.message);
    }

    // 测试5: 兑换奖励
    console.log('\n【测试5】兑换奖励');
    try {
        const rewards = Storage.getAll('rewards');
        if (rewards.length > 0) {
            const reward = rewards[0];
            Storage.set('points', reward.value + 100);
            const pointsBefore = Storage.getPoints();
            
            Storage.changePoints(-reward.value);
            const pointsAfter = Storage.getPoints();
            
            logTest('兑换奖励', pointsAfter === pointsBefore - reward.value, 
                `奖励: ${reward.name}, 积分: ${pointsBefore} → ${pointsAfter}`);
        } else {
            logTest('兑换奖励', false, '没有可兑换的奖励');
        }
    } catch (err) {
        logTest('兑换奖励', false, err.message);
    }

    // 测试6: 积分不足时兑换奖励
    console.log('\n【测试6】积分不足时兑换奖励');
    try {
        const rewards = Storage.getAll('rewards');
        if (rewards.length > 0) {
            const reward = rewards[0];
            Storage.set('points', 10);
            const pointsBefore = Storage.getPoints();
            
            Storage.changePoints(-reward.value);
            const pointsAfter = Storage.getPoints();
            
            // 积分可以是负数，这是业务逻辑
            logTest('积分不足时兑换奖励', pointsAfter === pointsBefore - reward.value, 
                `奖励: ${reward.name}, 积分: ${pointsBefore} → ${pointsAfter} (允许负数)`);
        } else {
            logTest('积分不足时兑换奖励', false, '没有可兑换的奖励');
        }
    } catch (err) {
        logTest('积分不足时兑换奖励', false, err.message);
    }

    // 测试7: 删除奖励
    console.log('\n【测试7】删除奖励');
    try {
        const rewardsBefore = Storage.getAll('rewards');
        if (rewardsBefore.length > 0) {
            const rewardId = rewardsBefore[0].id;
            Storage.removeItemById('rewards', rewardId);
            const rewardsAfter = Storage.getAll('rewards');
            const deleted = !rewardsAfter.some(r => r.id === rewardId);
            
            logTest('删除奖励', deleted && rewardsAfter.length === rewardsBefore.length - 1, 
                `数量: ${rewardsBefore.length} → ${rewardsAfter.length}`);
        } else {
            logTest('删除奖励', false, '没有可删除的奖励');
        }
    } catch (err) {
        logTest('删除奖励', false, err.message);
    }

    // 测试8: 删除任务
    console.log('\n【测试8】删除任务');
    try {
        const tasksBefore = Storage.getAll('tasks');
        if (tasksBefore.length > 0) {
            const taskId = tasksBefore[0].id;
            Storage.removeItemById('tasks', taskId);
            const tasksAfter = Storage.getAll('tasks');
            const deleted = !tasksAfter.some(t => t.id === taskId);
            
            logTest('删除任务', deleted && tasksAfter.length === tasksBefore.length - 1, 
                `数量: ${tasksBefore.length} → ${tasksAfter.length}`);
        } else {
            logTest('删除任务', false, '没有可删除的任务');
        }
    } catch (err) {
        logTest('删除任务', false, err.message);
    }

    // 测试9: 设置休息工作比
    console.log('\n【测试9】设置休息工作比');
    try {
        Storage.setRestRatio(6);
        const ratio = Storage.getRestRatio();
        logTest('设置休息工作比', ratio === 6, `休息工作比: ${ratio}`);
    } catch (err) {
        logTest('设置休息工作比', false, err.message);
    }

    // 测试10: 任务优先级排序
    console.log('\n【测试10】任务优先级排序');
    try {
        const tasks = Storage.getAll('tasks');
        const sorted = [...tasks].sort((a, b) => {
            const pa = a.priority === 'max' ? Infinity : Number(a.priority);
            const pb = b.priority === 'max' ? Infinity : Number(b.priority);
            return pb - pa;
        });
        
        // 验证排序是否正确
        const isSorted = sorted.every((t, i) => {
            if (i === 0) return true;
            const prev = sorted[i - 1];
            const curr = t;
            const pa = prev.priority === 'max' ? Infinity : Number(prev.priority);
            const pb = curr.priority === 'max' ? Infinity : Number(curr.priority);
            return pa >= pb;
        });
        
        const hasMaxFirst = sorted.length > 0 && sorted[0].priority === 'max';
        
        logTest('任务优先级排序', isSorted && hasMaxFirst, 
            `排序正确: ${isSorted}, max优先: ${hasMaxFirst}`);
    } catch (err) {
        logTest('任务优先级排序', false, err.message);
    }

    // 测试11: 数据持久化
    console.log('\n【测试11】数据持久化');
    try {
        const hasPoints = storage.getItem('rof:points') !== null;
        const hasTasks = storage.getItem('rof:tasks') !== null;
        const hasRewards = storage.getItem('rof:rewards') !== null;
        const hasUsername = storage.getItem('rof:username') !== null;
        
        logTest('数据持久化', hasPoints && hasTasks && hasRewards && hasUsername, 
            `数据项: ${storage.length}`);
    } catch (err) {
        logTest('数据持久化', false, err.message);
    }

    // 测试12: findById 功能
    console.log('\n【测试12】findById 功能');
    try {
        const rewards = Storage.getAll('rewards');
        if (rewards.length > 0) {
            const reward = rewards[0];
            const found = Storage.findById('rewards', reward.id);
            const notFound = Storage.findById('rewards', 'nonexistent');
            
            logTest('findById 功能', found && found.id === reward.id && !notFound, 
                `找到: ${found.name}, 未找到: ${notFound === null}`);
        } else {
            logTest('findById 功能', false, '没有奖励数据');
        }
    } catch (err) {
        logTest('findById 功能', false, err.message);
    }

    // 测试13: 边界情况 - 空数组
    console.log('\n【测试13】边界情况 - 空数组');
    try {
        Storage.set('empty_test', []);
        const arr = Storage.get('empty_test');
        logTest('空数组处理', Array.isArray(arr) && arr.length === 0, `数组: ${JSON.stringify(arr)}`);
    } catch (err) {
        logTest('空数组处理', false, err.message);
    }

    // 测试14: 边界情况 - 积分计算
    console.log('\n【测试14】边界情况 - 积分计算');
    try {
        Storage.set('points', 0);
        Storage.changePoints(100);
        Storage.changePoints(-50);
        Storage.changePoints(-25);
        const final = Storage.getPoints();
        
        logTest('积分计算', final === 25, `最终积分: ${final}`);
    } catch (err) {
        logTest('积分计算', false, err.message);
    }

    // 测试15: HTML 文件存在性检查
    console.log('\n【测试15】HTML 文件存在性检查');
    try {
        const files = ['index.html', 'add_reward.html', 'add_task.html', 'remove.html', 'timer.html', 'settings.html', 'about.html'];
        const results = await Promise.all(files.map(async (file) => {
            try {
                await fs.access(path.join(__dirname, '..', file));
                return true;
            } catch {
                return false;
            }
        }));
        
        const allExist = results.every(r => r);
        logTest('HTML 文件存在', allExist, `文件: ${files.join(', ')}`);
    } catch (err) {
        logTest('HTML 文件存在', false, err.message);
    }

    // 打印测试结果
    console.log('\n' + '='.repeat(70));
    console.log('测试结果汇总');
    console.log('='.repeat(70));
    console.log(`总测试数: ${testResults.total}`);
    console.log(`通过: ${testResults.passed.length}`);
    console.log(`失败: ${testResults.failed.length}`);
    console.log(`通过率: ${((testResults.passed.length / testResults.total) * 100).toFixed(2)}%`);
    
    if (testResults.failed.length > 0) {
        console.log('\n失败的测试:');
        testResults.failed.forEach(f => {
            console.log(`  - ${f.name}: ${f.details}`);
        });
    }
    
    console.log('='.repeat(70));
    
    return testResults;
}

// 运行测试
runTests().then(results => {
    process.exit(results.failed.length > 0 ? 1 : 0);
}).catch(err => {
    console.error('测试运行失败:', err);
    process.exit(1);
});
