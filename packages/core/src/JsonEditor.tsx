import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { JSONEditor, JSONEditorPropsOptional, JSONPath, Mode, Mode as ModeEnum } from 'gm-vanilla-jsoneditor';

import 'gm-vanilla-jsoneditor/themes/jse-theme-dark.css';

const getValueFromJsonPath = (json: any, path: JSONPath) => {
  return path.reduce((value, curr) => {
    return value[curr];
  }, json);
};

interface Props extends JSONEditorPropsOptional {
  onExpose?: (path: string[], exposedValue: any) => void;
  exposedPaths?: JSONPath[];
  theme? : 'dark' | 'light'
}

const JsonEditor: FC<Props> = ({ theme, onExpose, exposedPaths, ..._props }) => {
  const { mode: _mode, ...restProps } = _props;

  const mode = useMemo(
    () =>
      _mode === undefined
        ? undefined
        : // @ts-ignore
          {
            text: ModeEnum.text,
            tree: ModeEnum.tree,
            table: ModeEnum.table
          }[_mode],
    [_mode]
  );

  const props = useMemo(() => ({ mode, ...restProps }), [mode, restProps]);

  const [container, setContainer] = useState<HTMLElement | null>(null);
  const refEditor = useRef<JSONEditor | null>(null);

  useEffect(() => {
    //@ts-ignore
    window.handleRsExpose = (path: string[]) => {
      //@ts-ignore
      const json = refEditor.current.get().json;
      const exposedValue = getValueFromJsonPath(json, path);
      console.log(path);

      if (onExpose) {
        onExpose(path, exposedValue);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (container !== null) {
      refEditor.current = new JSONEditor({
        target: container,
        props: {}
      });
    }

    return () => {
      if (refEditor.current !== null) {
        refEditor.current.destroy();
        refEditor.current = null;
      }
    };
  }, [container]);

  useEffect(() => {
    if (refEditor.current !== null) {
      refEditor.current.updateProps(props).then(() => {
        if (props.mode === Mode.tree) {
          // @ts-ignore
          refEditor.current.expand(path => path.length < 1);
        }
      });

      if (exposedPaths) {
        let css = '';
        exposedPaths.forEach(ep => {
          css =
            `div[data-path="%2F${ep.join('%2F')}"]::before {
                left: ${(ep.length - 1) * 18}px;
            }` + css;
          css += `div[data-path="%2F${ep.join('%2F')}"]::before, `;
        });
        css = css.slice(0, -2);
        css += `{
            content: url('https://api.iconify.design/bi/exclamation-circle-fill.svg?color=white&width=16&height=16');
            position: absolute;
            top: 0
          }`;

        exposedPaths.forEach(ep => {
          for (let i = 1; i < ep.length; i++) {
            css =
              `div[data-path="%2F${ep.slice(0, i).join('%2F')}"]::before {
                left: ${(i - 1) * 18}px;
            }` + css;
            css += `div[data-path="%2F${ep.slice(0, i).join('%2F')}"]::before, `;
          }
        });
        css = css.slice(0, -2);
        css += `{
          content: url('https://api.iconify.design/bi/exclamation-circle.svg?color=white&width=16&height=16');
          position: absolute;
          top: 0
        }`;

        const oldStyle = document.getElementById('exposed-icons-style');
        if (oldStyle) {
          oldStyle.remove();
        }
        const style = document.createElement('style');
        style.id = 'exposed-icons-style';
        document.head.appendChild(style);
        style.appendChild(document.createTextNode(css));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props]);

  return <div className={theme === 'dark' ? 'jse-theme-dark' : ''} ref={node => setContainer(node)}></div>;
};


export default JsonEditor;
