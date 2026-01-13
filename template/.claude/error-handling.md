# JVibe Error Handling

统一定义异常处理策略，避免静默失败或错误写入。

## 总原则

- 不确定即停止：无法解析或缺少上下文时不写文件
- 只重试一次：避免无限循环
- 保留证据：错误需记录关键信息（命令/日志/路径）

## 处理矩阵

```yaml
error_handling:
  subagent_timeout:
    retry: 1
    on_fail: ask_user_and_stop
  invalid_output:
    action: request_reformat_once
    on_fail: ask_user_and_stop
  parse_failure:
    action: ask_user_with_context
    write: forbidden
  test_failure:
    action: return_to_developer
    update_status: blocked
  env_missing:
    action: ask_main_agent
    write: forbidden
  hook_failure:
    action: warn_only
  subagent_unavailable:
    action: ask_user_and_stop
```

## 具体规则

1. **Subagent 超时**
   - 重试 1 次
   - 仍失败 → 请求用户确认下一步

2. **输出格式不符合**
   - 要求一次重排
   - 仍不符合 → 终止并提示用户

3. **文档解析失败**
   - 不写任何文件
   - 输出不一致点并请求用户修正

4. **测试失败**
   - 不更新功能状态
   - 返回失败用例与首个堆栈片段
   - 交回 developer 处理

5. **环境缺失**
   - 仅提示创建/激活方式
   - 禁止自动安装依赖

6. **Hooks 报错**
   - 仅警告，不阻塞主流程
