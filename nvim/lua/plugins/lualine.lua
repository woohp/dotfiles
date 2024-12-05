-- In your LazyVim config file
return {
  {
    "nvim-lualine/lualine.nvim",
    opts = function(_, opts)
      -- Create a custom diagnostics component
      local function diagnostics_with_line()
        local function get_first_diagnostic_line(severity)
          local diagnostics = vim.diagnostic.get(0, { severity = severity })
          if #diagnostics > 0 then
            return diagnostics[1].lnum + 1 -- Convert to 1-based line number
          end
          return nil
        end

        local result = {}
        local icons = require("lazyvim.config").icons.diagnostics

        -- Check each severity level
        local error_line = get_first_diagnostic_line(vim.diagnostic.severity.ERROR)
        local warn_line = get_first_diagnostic_line(vim.diagnostic.severity.WARN)
        local info_line = get_first_diagnostic_line(vim.diagnostic.severity.INFO)
        local hint_line = get_first_diagnostic_line(vim.diagnostic.severity.HINT)

        -- Format the counts and line numbers
        local diagnostics = vim.diagnostic.get(0)
        local counts = {
          errors = #vim.diagnostic.get(0, { severity = vim.diagnostic.severity.ERROR }),
          warnings = #vim.diagnostic.get(0, { severity = vim.diagnostic.severity.WARN }),
          info = #vim.diagnostic.get(0, { severity = vim.diagnostic.severity.INFO }),
          hints = #vim.diagnostic.get(0, { severity = vim.diagnostic.severity.HINT }),
        }

        if counts.errors > 0 then
          table.insert(result, icons.Error .. counts.errors .. (error_line and (":" .. error_line) or ""))
        end
        if counts.warnings > 0 then
          table.insert(result, icons.Warn .. counts.warnings .. (warn_line and (":" .. warn_line) or ""))
        end
        if counts.info > 0 then
          table.insert(result, icons.Info .. counts.info .. (info_line and (":" .. info_line) or ""))
        end
        if counts.hints > 0 then
          table.insert(result, icons.Hint .. counts.hints .. (hint_line and (":" .. hint_line) or ""))
        end

        return table.concat(result, " ")
      end

      -- Replace the existing diagnostics component in lualine_c
      for i, component in ipairs(opts.sections.lualine_c) do
        if type(component) == "table" and component[1] == "diagnostics" then
          opts.sections.lualine_c[i] = {
            diagnostics_with_line,
            separator = "",
            padding = { left = 1, right = 1 },
          }
          break
        end
      end

      opts.extensions = { "neo-tree" }
    end,
  },
}
