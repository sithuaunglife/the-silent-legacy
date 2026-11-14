/** Bridges the independent Moon/Mars canvas engines with the React NASA dashboard. */
export function createArtifactViewer(world, getLunar = () => null) {
  let enabled=true;
  return {
    show(record, lunarIndex) {
      if(!enabled)return;
      window.dispatchEvent(new CustomEvent('silent:inspect',{detail:{
        world, id:record[0], originalRecord:record,
        onScan:lunarIndex===undefined?null:()=>getLunar()?.markScanned(lunarIndex)
      }}));
    },
    destroy(){enabled=false;}
  };
}
